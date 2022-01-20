// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import user, { userType } from '../../db/models/user';
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { parse } from "cookie";

type Data = {
  ok: boolean;
  error?: string;
  result?: string;
}

const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'cyan', 'magenta', 'orange', 'purple']

const generateSomeText = (): string => {
  let t = "";
  for (let i = 0; i < 10; i++) {
    t += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
  }
  return t;
}

const generateAccessToken = (): string => {
  return sign({}, generateSomeText(), { expiresIn: '1h' })
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!req.body) return res.status(400).json({ ok: false, error: 'no data' })
  if (!req.body.username || typeof req.body.username !== "string") return res.status(400).json({ ok: false, error: 'no username' })
  if (!req.body.password || typeof req.body.password !== "string") return res.status(400).json({ ok: false, error: 'no password' })
  user.findOne({
    username: req.body.username.toLowerCase()
  }).then((usr?: userType) => {
    if (usr) {
      compare(req.body.password, usr.password).then((valid) => {
        if (valid) {
          res.setHeader('Set-Cookie', `accessToken=${usr.accessToken}; HttpOnly; Path=/; Max-Age=2592000; Secure`);
          res.status(200).json({
            ok: true,
            result: usr._id.toString()
          })
        } else {
          res.status(401).json({ ok: false, error: 'invalid password' })
        }
      })
    } else {
      if (!req.body.color || typeof req.body.color !== "string") return res.status(400).json({ ok: false, error: 'no color' })
      if (!colors.includes(req.body.color)) return res.status(400).json({ ok: false, error: 'invalid color' })
      hash(req.body.password, 10).then((pw) => {
        user.create({
          username: req.body.username.toLowerCase(),
          password: pw,
          color: req.body.color,
          accessToken: generateAccessToken(),
          apiKey: generateAccessToken()
        }).then((user) => {
          res.setHeader('Set-Cookie', `accessToken=${user.accessToken}; HttpOnly; Path=/; Max-Age=2592000; Secure`);
          res.status(200).json({
            ok: true,
            result: user.apiKey
          })
        })
      })
    }
  })
}


export const auth = (req: { headers: { cookie: string } }): Promise<userType | undefined> => {
  return new Promise((res) => {
    if (req.headers && req.headers.cookie && typeof req.headers.cookie === "string") {
      const cookies = parse(req.headers.cookie)
      if (cookies.accessToken && typeof cookies.accessToken === "string") {
        user.findOne({
          accessToken: cookies.accessToken
        }, (err: any, usr: userType) => {
          if (usr) {
            res(usr);
          } else {
            res(undefined)
          }
        });
      } else {
        res(undefined);
      }
    } else {
      res(undefined);
    }
  })
}