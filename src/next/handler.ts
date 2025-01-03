import type { NextApiRequest, NextApiResponse } from "next";

import { serialize } from "cookie";
import { HolipolyExternalAuth } from "../HolipolyExternalAuth";

export const createHolipolyExternalAuthHandler =
  (auth: HolipolyExternalAuth) => async (req: NextApiRequest, res: NextApiResponse) => {
    const { state, code } = req.query as { state: string; code: string };

    const { token } = await auth.obtainAccessToken({ state, code });

    res.setHeader("Set-Cookie", serialize("token", token, { path: "/" }));
    res.redirect("/");
  };
