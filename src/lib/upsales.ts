// Upsales API integration
// Docs: https://api.upsales.com/

const UPSALES_TOKEN = process.env.UPSALES_API_KEY || "";
const BASE_URL = "https://power.upsales.com/api/v2";

function url(path: string, params?: Record<string, string>) {
  const u = new URL(`${BASE_URL}${path}`);
  u.searchParams.set("token", UPSALES_TOKEN);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

async function upsalesFetch(path: string, options?: RequestInit & { params?: Record<string, string> }) {
  const { params, ...fetchOpts } = options || {};
  const res = await fetch(url(path, params), {
    ...fetchOpts,
    headers: {
      "Content-Type": "application/json",
      ...fetchOpts?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsales API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ---- CONTACTS ----

export interface UpsalesContact {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  cellPhone: string | null;
  title: string | null;
  titleCategory: string | null;
  score: number;
  scoreUpdateDate: string | null;
  journeyStep: string | null;
  client: { id: number; name: string } | null;
  regDate: string;
  modDate: string;
  hasVisit: boolean;
  hasForm: boolean;
  hasMail: boolean;
  hasOrder: boolean | null;
  hasOpportunity: boolean | null;
  hasActivity: boolean | null;
  segments: Array<{ id: number; name: string }>;
  custom: Array<{ fieldId: number; value: unknown }>;
}

export async function searchContactByEmail(email: string): Promise<UpsalesContact | null> {
  try {
    const data = await upsalesFetch("/contacts", {
      params: { "email.eq": email, limit: "1" },
    });
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (e) {
    console.error("Upsales searchContactByEmail error:", e);
    return null;
  }
}

export async function searchContactByPhone(phone: string): Promise<UpsalesContact | null> {
  try {
    // Clean phone number - remove spaces and country code prefix
    const cleaned = phone.replace(/[\s-]/g, "").replace(/^\+46/, "0").replace(/^46/, "0");
    const data = await upsalesFetch("/contacts", {
      params: { "cellPhone.eq": cleaned, limit: "1" },
    });
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (e) {
    console.error("Upsales searchContactByPhone error:", e);
    return null;
  }
}

export async function createContact(contact: {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  clientId?: number;
}): Promise<UpsalesContact | null> {
  try {
    const nameParts = contact.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const body: Record<string, unknown> = {
      firstName,
      lastName,
      name: contact.name,
      email: contact.email,
    };

    if (contact.phone) body.cellPhone = contact.phone;
    if (contact.title) body.title = contact.title;
    if (contact.clientId) body.client = { id: contact.clientId };

    const data = await upsalesFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.data || null;
  } catch (e) {
    console.error("Upsales createContact error:", e);
    return null;
  }
}

export async function updateContact(
  contactId: number,
  updates: Record<string, unknown>
): Promise<UpsalesContact | null> {
  try {
    const data = await upsalesFetch(`/contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify({ id: contactId, ...updates }),
    });
    return data.data || null;
  } catch (e) {
    console.error("Upsales updateContact error:", e);
    return null;
  }
}

// ---- ACCOUNTS (Clients) ----

export interface UpsalesAccount {
  id: number;
  name: string;
  phone: string | null;
  webpage: string | null;
  orgNo: string | null;
  industry: string | null;
  active: number;
  score: number;
  addresses: Array<{ city: string | null; state: string | null; country: string }>;
  users: Array<{ id: number; name: string }>;
}

export async function searchAccountByName(name: string): Promise<UpsalesAccount | null> {
  try {
    const data = await upsalesFetch("/accounts", {
      params: { "name.eq": name, limit: "1" },
    });
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (e) {
    console.error("Upsales searchAccountByName error:", e);
    return null;
  }
}

export async function searchAccountByDomain(domain: string): Promise<UpsalesAccount | null> {
  try {
    const data = await upsalesFetch("/accounts", {
      params: { "webpage.eq": domain, limit: "1" },
    });
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (e) {
    console.error("Upsales searchAccountByDomain error:", e);
    return null;
  }
}

export async function createAccount(account: {
  name: string;
  webpage?: string;
}): Promise<UpsalesAccount | null> {
  try {
    const data = await upsalesFetch("/accounts", {
      method: "POST",
      body: JSON.stringify(account),
    });
    return data.data || null;
  } catch (e) {
    console.error("Upsales createAccount error:", e);
    return null;
  }
}

// ---- ACTIVITIES ----

export async function createActivity(activity: {
  description: string;
  contactIds: number[];
  clientId?: number;
  date?: string;
  activityTypeId?: number;
}): Promise<unknown> {
  try {
    const body: Record<string, unknown> = {
      description: activity.description,
      date: activity.date || new Date().toISOString().split("T")[0],
      contacts: activity.contactIds.map((id) => ({ id })),
      // Default to "Webbbesok" activity type (create one if needed)
      activityType: activity.activityTypeId ? { id: activity.activityTypeId } : undefined,
    };

    if (activity.clientId) {
      body.client = { id: activity.clientId };
    }

    const data = await upsalesFetch("/activities", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.data || null;
  } catch (e) {
    console.error("Upsales createActivity error:", e);
    return null;
  }
}

// ---- COMPOSITE: Find or create contact ----

export async function findOrCreateContact(lead: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  product?: string;
  source?: string;
}): Promise<{
  contact: UpsalesContact | null;
  account: UpsalesAccount | null;
  isNew: boolean;
}> {
  // 1. Search for existing contact by email
  let contact = await searchContactByEmail(lead.email);
  let isNew = false;

  if (contact) {
    // Contact exists - log the visit as activity
    const productLabel = lead.product || "okand produkt";
    const sourceLabel = lead.source || "direkt";
    await createActivity({
      description: `Besökte ${productLabel}-sidan via ${sourceLabel}. Identifierade sig med glass-erbjudande pa clearon.live/${lead.product || ""}.`,
      contactIds: [contact.id],
      clientId: contact.client?.id,
    });

    const account = contact.client ? { ...contact.client } as unknown as UpsalesAccount : null;
    return { contact, account, isNew };
  }

  // 2. Search by phone if provided
  if (lead.phone) {
    contact = await searchContactByPhone(lead.phone);
    if (contact) {
      // Update email on existing contact
      await updateContact(contact.id, { email: lead.email });

      const productLabel = lead.product || "okand produkt";
      await createActivity({
        description: `Besökte ${productLabel}-sidan. Identifierade sig med glass-erbjudande (ny email tillagd: ${lead.email}).`,
        contactIds: [contact.id],
        clientId: contact.client?.id,
      });

      const account = contact.client ? { ...contact.client } as unknown as UpsalesAccount : null;
      return { contact, account, isNew: false };
    }
  }

  // 3. Contact not found - create new
  isNew = true;
  let account: UpsalesAccount | null = null;

  // Try to find or create account
  if (lead.company) {
    account = await searchAccountByName(lead.company);
    if (!account) {
      // Try domain from email
      const emailDomain = lead.email.split("@")[1];
      if (emailDomain && !["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "live.se", "icloud.com"].includes(emailDomain)) {
        account = await searchAccountByDomain(emailDomain);
      }
    }
    if (!account) {
      account = await createAccount({ name: lead.company });
    }
  } else {
    // Try to match by email domain
    const emailDomain = lead.email.split("@")[1];
    if (emailDomain && !["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "live.se", "icloud.com"].includes(emailDomain)) {
      account = await searchAccountByDomain(emailDomain);
    }
  }

  // Create the contact
  contact = await createContact({
    name: lead.name || lead.email.split("@")[0],
    email: lead.email,
    phone: lead.phone,
    clientId: account?.id,
  });

  if (contact) {
    const productLabel = lead.product || "okand produkt";
    const sourceLabel = lead.source || "direkt";
    await createActivity({
      description: `Ny lead fran clearon.live/${lead.product || ""}. Kom via ${sourceLabel}. Identifierade sig med glass-erbjudande. Produkt: ${productLabel}.`,
      contactIds: [contact.id],
      clientId: account?.id,
    });
  }

  return { contact, account, isNew };
}
