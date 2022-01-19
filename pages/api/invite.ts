import { NextApiRequest, NextApiResponse } from "next";
import group from "../../db/models/group";
import user from "../../db/models/user";
import { auth } from "./login";

const invite = (req: NextApiRequest, res: NextApiResponse<{ ok: boolean, result?: string, error?: string }>) => {
    auth(req as any).then((usr) => {
        if (usr) {
            if (!req.body) return res.status(400).json({ ok: false, error: 'no data' });
            if (!req.body.name || typeof req.body.name !== "string") return res.status(400).json({ ok: false, error: 'no name' });
            if (!req.body.id || typeof req.body.name !== "string") return res.status(400).json({ ok: false, error: 'no name' });
            group.findById(req.body.id).then((group) => {
                if (group) {
                    if (group.invites.length > 10) return res.status(400).json({ ok: false, error: "too many invites" });
                    user.findOne({ username: req.body.name }).then((suser) => {
                        if (suser) {
                            if (!group.invited.includes(suser._id) && !group.users.includes(suser._id)) {
                                group.invited.push(suser._id);
                                group.save();
                                return res.status(200).json({
                                    ok: true,
                                    result: "invited"
                                });
                            } else {
                                return res.status(400).json({ ok: false, error: 'already invited' });
                            }
                        } else {
                            return res.status(400).json({ ok: false, error: 'no user' });
                        }
                    })
                } else {
                    return res.status(404).json({
                        ok: false,
                        error: "group not found"
                    });
                }
            })
        } else {
            return res.status(401).json({ ok: false, error: "invalid token" });
        }
    })
}

export default invite;