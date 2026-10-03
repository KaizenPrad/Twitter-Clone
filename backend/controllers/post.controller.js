import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import { reportToSentinel, now, burstCount, containsLink, extractDomain, looksPhishy, clientIp } from "../lib/sentinel.js";

export const createPost = async (req, res) => {
	try {
		const { text } = req.body;
		let { img } = req.body;
		const userId = req.user._id.toString();

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!text && !img) {
			return res.status(400).json({ error: "Post must have text or image" });
		}

		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		const newPost = new Post({
			user: userId,
			text,
			img,
		});

		await newPost.save();

		// Sentinel: content signals — link / phishing / spam-burst.
		// Batched in ONE call for the same userIdentity so correlation fires.
		try {
			const email = user.email || user.username;
			const sigs = [];
			const spamCount = burstCount(`post:${userId}`, 60_000);
			if (text && containsLink(text)) {
				sigs.push({
					signalType: "PHISH_CLICK",
					category: "WEB",
					severity: looksPhishy(text) ? "HIGH" : "MEDIUM",
					message: `Suspicious link posted by ${user.username}: ${(text || "").slice(0, 120)}`,
					userIdentity: email,
					sourceIp: clientIp(req),
					hostname: "twitter-clone",
					domain: extractDomain(text),
					eventTimestamp: now(),
					rawData: { contentPreview: String(text).slice(0, 500), postId: String(newPost._id) },
				});
				const dom = extractDomain(text);
				if (dom) {
					sigs.push({
						signalType: "SUSPICIOUS_DNS",
						category: "NETWORK",
						severity: "MEDIUM",
						message: `First-seen domain ${dom} posted by ${user.username}`,
						userIdentity: email,
						sourceIp: clientIp(req),
						hostname: "twitter-clone",
						domain: dom,
						eventTimestamp: now(),
						rawData: { postId: String(newPost._id) },
					});
				}
			}
			if (spamCount >= 5) {
				sigs.push({
					signalType: "BEACONING",
					category: "NETWORK",
					severity: "MEDIUM",
					message: `Spam burst: ${spamCount} posts/min by ${user.username}`,
					userIdentity: email,
					sourceIp: clientIp(req),
					hostname: "twitter-clone",
					eventTimestamp: now(),
					rawData: { postsInMinute: spamCount },
				});
			}
			if (sigs.length) reportToSentinel(sigs);
		} catch {}
		res.status(201).json(newPost);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
	}
};

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = { user: userId, text };

		post.comments.push(comment);
		await post.save();

		// Sentinel: malicious link inside a comment/reply
		try {
			if (text && containsLink(text)) {
				const me = await User.findById(userId).select("username email");
				const dom = extractDomain(text);
				reportToSentinel([
					{
						signalType: "PHISH_CLICK",
						category: "WEB",
						severity: looksPhishy(text) ? "HIGH" : "MEDIUM",
						message: `Suspicious link in comment by ${me?.username || userId}`,
						userIdentity: me?.email || String(userId),
						sourceIp: clientIp(req),
						hostname: "twitter-clone",
						domain: dom,
						eventTimestamp: now(),
						rawData: { contentPreview: String(text).slice(0, 500), postId: String(postId) },
					},
				]);
			}
		} catch {}

		res.status(200).json(post);
	} catch (error) {
		console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
			await notification.save();

			// Sentinel: bot-like like-burst (many likes/min = automation)
			try {
				const n = burstCount(`like:${String(userId)}`, 60_000);
				if (n >= 10) {
					const me = await User.findById(userId).select("username email");
					reportToSentinel([
						{
							signalType: "BEACONING",
							category: "NETWORK",
							severity: "MEDIUM",
							message: `Like-bot burst: ${n} likes/min by ${me?.username || userId}`,
							userIdentity: me?.email || String(userId),
							sourceIp: clientIp(req),
							hostname: "twitter-clone",
							eventTimestamp: now(),
							rawData: { likesInMinute: n },
						},
					]);
				}
			} catch {}

			const updatedLikes = post.likes;
			res.status(200).json(updatedLikes);
		}
	} catch (error) {
		console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		if (posts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};