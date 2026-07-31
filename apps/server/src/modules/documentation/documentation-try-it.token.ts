import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { DOCUMENTATION_TRY_IT_ATTEMPT_TOKEN_LIFETIME_MS } from "@repo/constants";

type Surface = "internal" | "public";
type TokenPayload = {
  v: 1;
  s: Surface;
  a: string;
  p: string;
  n: string;
  exp: number;
};

const digest_binding = (secret: string, label: string, value: string) =>
  createHmac("sha256", secret).update(`${label}\0${value}`).digest("base64url");

const signature = (secret: string, encoded_payload: string) =>
  createHmac("sha256", secret).update(encoded_payload).digest("base64url");

export const create_documentation_try_it_attempt_token = (input: {
  secret: string;
  surface: Surface;
  authorization_binding: string;
  policy_binding: string;
  now?: Date;
  nonce?: string;
}) => {
  if (input.secret.length < 32)
    throw new Error("Try-It token secret is too short");
  const now = input.now ?? new Date();
  const payload: TokenPayload = {
    v: 1,
    s: input.surface,
    a: digest_binding(
      input.secret,
      "authorization",
      input.authorization_binding,
    ),
    p: digest_binding(input.secret, "policy", input.policy_binding),
    n: input.nonce ?? randomBytes(18).toString("base64url"),
    exp: now.getTime() + DOCUMENTATION_TRY_IT_ATTEMPT_TOKEN_LIFETIME_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `v1.${encoded}.${signature(input.secret, encoded)}`;
};

export const verify_documentation_try_it_attempt_token = (input: {
  token: string;
  secret: string;
  surface: Surface;
  authorization_binding: string;
  policy_binding: string;
  now?: Date;
}) => {
  const [version, encoded, supplied_signature] = input.token.split(".");
  if (version !== "v1" || !encoded || !supplied_signature)
    throw new Error("Try-It attempt token is invalid");
  const expected_signature = signature(input.secret, encoded);
  const supplied = Buffer.from(supplied_signature);
  const expected = Buffer.from(expected_signature);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    throw new Error("Try-It attempt token is invalid");
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new Error("Try-It attempt token is invalid");
  }
  if (
    payload.v !== 1 ||
    payload.s !== input.surface ||
    payload.a !==
      digest_binding(
        input.secret,
        "authorization",
        input.authorization_binding,
      ) ||
    payload.p !== digest_binding(input.secret, "policy", input.policy_binding)
  )
    throw new Error("Try-It attempt token is invalid");
  if (payload.exp < (input.now ?? new Date()).getTime())
    throw new Error("Try-It attempt token expired");
  return {
    surface: payload.s,
    expires_at: new Date(payload.exp),
    nonce: payload.n,
  };
};
