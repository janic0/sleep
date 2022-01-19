import { NextApiRequest, NextApiResponse } from "next";
import group from "../../db/models/group";
import { auth } from "./login";

const createGroup = (req: NextApiRequest, res: NextApiResponse<{ ok: boolean, result?: string, error?: string }>) => {
    auth(req as any).then((usr) => {
        if (usr) {
            group.find({
                owner: usr._id
            }).then((ownerGroups) => {
                if (ownerGroups.length > 10) return res.status(400).json({ ok: false, error: "too many groups" });
                if (!req.body) return res.status(400).json({ ok: false, error: 'no data' });
                if (!req.body.name || typeof req.body.name !== "string") return res.status(400).json({ ok: false, error: 'no name' });
                group.create({
                    name: req.body.name,
                    owner: usr._id,
                    users: [usr._id]
                }).then((group) => {
                    res.status(200).json({
                        ok: true,
                        result: group._id.toString()
                    });
                });
            })
        } else {
            res.status(401).json({ ok: false, error: "invalid token" });
        }
    })
}

export default createGroup;