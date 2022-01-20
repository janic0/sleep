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
                    if (g.users.includes(usr._id.toString())) {
                        group.findByIdAndUpdate(req.body.id, {
                            $pull: {
                                users: usr._id.toString()
                            }
                        }, { rawResult: true }).then(() => {
                            res.status(200).json({ ok: true, result: "removed" });
                        });
                    } else {
                        return res.status(404).json({
                            ok: false,
                            error: "group not found"
                        });
                    }
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