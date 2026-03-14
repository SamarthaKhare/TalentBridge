import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';
import redis from '../../config/redis';
import { config } from '../../config';
import { registerSchema, loginSchema } from '../../utils/validators';
import { AuthPayload } from '../../middleware/auth';

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenTTL,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTokenTTL,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
      },
    });

    // Create empty profile based on role
    if (data.role === 'HR') {
      await prisma.hrProfile.create({
        data: { userId: user.id, companyName: '' },
      });
    } else {
      await prisma.candidateProfile.create({
        data: { userId: user.id },
      });
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = generateTokens(payload);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: tokens.accessToken,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = generateTokens(payload);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: tokens.accessToken,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const blacklisted = await redis.get(`bl_${refreshToken}`);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthPayload;
    const newPayload: AuthPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    const tokens = generateTokens(newPayload);

    // Blacklist old refresh token
    await redis.setex(`bl_${refreshToken}`, 7 * 24 * 60 * 60, 'true');

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: tokens.accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (refreshToken) {
      await redis.setex(`bl_${refreshToken}`, 7 * 24 * 60 * 60, 'true');
    }
    if (accessToken) {
      await redis.setex(`bl_${accessToken}`, 15 * 60, 'true');
    }

    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out successfully' });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
