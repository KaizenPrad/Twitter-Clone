import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { reportToSentinel, now, burstCount, isOffHours, clientIp } from "../lib/sentinel.js";

export const signup = async (req, res) => {
	try {
		const { fullName, username, email, password } = req.body;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email is already taken" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
			generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			// Sentinel: new account (baseline signal, INFO — useful for spam-wave correlation)
			reportToSentinel([
				{
					signalType: "NEW_ACCOUNT",
					category: "AUTH",
					severity: "INFO",
					message: `New signup: ${newUser.username} (${newUser.email})`,
					userIdentity: newUser.email,
					sourceIp: clientIp(req),
					hostname: "twitter-clone",
					eventTimestamp: now(),
					rawData: { username: newUser.username },
				},
			]);

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
				followers: newUser.followers,
				following: newUser.following,
				profileImg: newUser.profileImg,
				coverImg: newUser.coverImg,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			// Sentinel: failed login → brute-force heuristic (same IP+username burst)
			const key = `login-fail:${clientIp(req)}:${username}`;
			const attempts = burstCount(key, 60_000);
			if (attempts >= 3) {
				reportToSentinel([
					{
						signalType: "BRUTE_FORCE_BURST",
						category: "AUTH",
						severity: "HIGH",
						message: `Failed login x${attempts} for ${username}`,
						userIdentity: user?.email || username,
						sourceIp: clientIp(req),
						hostname: "twitter-clone",
						eventTimestamp: now(),
						rawData: { attempts, username },
					},
				]);
			}
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

		// Sentinel: suspicious success (off-hours). Send together with any burst context
		// so Sentinel correlates 2+ signals for the same userIdentity in ONE batch.
		if (isOffHours()) {
			reportToSentinel([
				{
					signalType: "OFF_HOURS_LOGIN",
					category: "AUTH",
					severity: "MEDIUM",
					message: `Off-hours login for ${user.username}`,
					userIdentity: user.email,
					sourceIp: clientIp(req),
					hostname: "twitter-clone",
					eventTimestamp: now(),
					rawData: { username: user.username },
				},
			]);
		}

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			followers: user.followers,
			following: user.following,
			profileImg: user.profileImg,
			coverImg: user.coverImg,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = async (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getMe controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};