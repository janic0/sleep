// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import datapoint from '../../db/models/datapoint'
import user from '../../db/models/user'


type Data = {
  ok: boolean;
  error?: string;
  result?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!req.body) return res.status(400).json({ ok: false, error: 'no data' })
  if (!req.body.value || typeof req.body.value !== 'number') return res.status(400).json({ ok: false, error: 'no value' })
  if (!req.body.token || typeof req.body.token !== 'string') return res.status(400).json({ ok: false, error: 'no token' })
  const now = new Date();
  user.findOne({
    apiKey: req.body.token
  }).then((usr) => {
    if (usr) {
      datapoint.find({ user: usr._id }).then((data) => {
        let updated = false;
        for (let d of data) {
          if (d.added.getFullYear() === now.getFullYear() && d.added.getMonth() === now.getMonth() && d.added.getDate() === now.getDate()) {
            d.value = req.body.value;
            d.added = new Date();
            d.save();
            updated = true;
            break;
          }
        }
        if (updated) return res.status(200).json({ ok: true, result: "updated" });
        datapoint.create({
          added: new Date(),
          value: req.body.value,
          user: usr._id
        }).then(() => {
          res.status(200).json({ ok: true, result: "created" });
        });
      });
    } else {
      res.status(401).json({
        ok: false,
        error: 'invalid token'
      })
    }
  })
}
