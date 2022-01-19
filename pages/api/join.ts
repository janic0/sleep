import { NextApiRequest, NextApiResponse } from "next";
import group from "../../db/models/group";
import { auth } from "./login";

const createGroup = (req: NextApiRequest, res: NextApiResponse<{ ok: boolean, result?: string, error?: string }>) => {
    auth(req as any).then((usr) => {
        if (usr) {
            if (!req.body) return res.status(400).json({ ok: false, error: 'no data' });
            if (!req.body.id || typeof req.body.id !== "string") return res.status(400).json({ ok: false, error: 'no id' });
            group.findById(req.body.id).then((g) => {
                if (g) {
                    console.log(g.invited);
                    if (g.invited.includes(usr._id.toString())) {
                        g.users.push(usr._id);
                        g.invited = g.invited.filter((invitee: string) => invitee !== usr._id.toString());
                        group.findByIdAndUpdate(g._id, {
                            users: g.users,
                            invited: g.invited
                        }, { rawResult: true }).then((_) => {
                            return res.status(200).json({
                                ok: true,
                                result: "joined"
                            });
                        })
                    } else
                        return res.status(400).json({ ok: false, error: 'not invited' });
                } else
                    return res.status(404).json({
                        ok: false,
                        error: "group not found"
                    });
            })
        } else {
            res.status(401).json({ ok: false, error: "invalid token" });
        }
    })
}

export default createGroup;