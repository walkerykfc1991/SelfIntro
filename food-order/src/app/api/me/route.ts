import { requireIdentity } from "../../../../cursor/identity";

export async function GET(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  return Response.json(
    {
      name: identity.name || "客人",
      email: identity.email,
      simulated: identity.simulated === true,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
