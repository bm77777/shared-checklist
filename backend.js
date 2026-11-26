import { PROJECT_URL, PUBLISHABLE_KEY } from "./config.js";

const bucketName = "home-private";
const keyFor = (kind, key) => JSON.stringify([kind, ...key]);

async function requireData(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function createSession(onSession) {
  if (!PROJECT_URL || !PUBLISHABLE_KEY) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(PROJECT_URL) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(PUBLISHABLE_KEY)) {
    throw new Error("공개 키와 프로젝트 주소를 확인해 주세요.");
  }
  const { createClient } = window.supabase;
  const client = createClient(PROJECT_URL, PUBLISHABLE_KEY);
  let currentUser;
  client.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
    if (event !== "INITIAL_SESSION" && user?.id === currentUser?.id) return;
    currentUser = user;
    setTimeout(() => onSession(user, client), 0);
  });
  return client;
}

export async function openHome(client, user, onChange, onStatus, onAccessLost) {
  const home = await requireData(client.from("homes").select("id, owner_id, profile, plan_path").limit(1).maybeSingle());
  if (!home) {
    const error = new Error("이 계정에 연결된 체크리스트가 없어요.");
    error.code = "home_access_denied";
    throw error;
  }
  const api = createHome(client, home, user, onChange, onStatus, onAccessLost);
  try {
    const plan = await api.download(home.plan_path);
    await api.start();
    return { api, profile: home.profile, plan, isOwner: home.owner_id === user.id };
  } catch (error) {
    api.close();
    throw error;
  }
}

export function createHome(client, home, user, onChange, onStatus, onAccessLost) {
  const records = new Map();
  const bucket = client.storage.from(bucketName);
  let alive = true;
  let channel;
  let interval;
  let refreshing;
  let realtime = false;

  function receive(rows) {
    if (!alive) return;
    let changed = false;
    for (const row of rows) {
      if (!row?.home_id || row.home_id !== home.id) continue;
      const index = keyFor(row.kind, row.record_key);
      if ((records.get(index)?.revision ?? 0) < row.revision) {
        records.set(index, row);
        changed = true;
      }
    }
    if (changed) onChange([...records.values()]);
  }

  function sync() {
    if (!alive) return;
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const allowed = await requireData(client.from("homes").select("id").eq("id", home.id).maybeSingle());
      if (!alive) return;
      if (!allowed) {
        onAccessLost();
        throw new Error("공유 프로젝트 접근 권한이 없어요.");
      }
      for (let offset = 0; alive; offset += 200) {
        const rows = await requireData(client.from("home_records").select("*").eq("home_id", home.id)
          .order("kind").order("record_key").range(offset, offset + 199));
        receive(rows);
        if (rows.length < 200) break;
      }
      if (alive) onStatus(realtime ? "실시간 연결됨" : "데이터를 불러왔어요. 실시간 연결을 확인하고 있어요.");
    })().catch(error => {
      if (alive) onStatus("연결을 확인하고 있어요. 저장 버튼에서 처리 상태를 확인하세요.");
      throw error;
    }).finally(() => { refreshing = undefined; });
    return refreshing;
  }

  function recover() {
    sync()?.catch(() => {});
  }

  async function write(kind, key, payload, expected = null, createOnly = false) {
    if (!alive) throw new Error("로그인이 필요합니다.");
    const params = { p_home: home.id, p_kind: kind, p_key: key, p_payload: payload,
      p_expected: expected, p_create_only: createOnly };
    const result = await requireData(client.rpc("save_home_record", params));
    const row = Array.isArray(result) ? result[0] : result;
    receive([row]);
    return row;
  }

  async function uploadPhoto(room, image, id, created = new Date().toISOString()) {
    if (!alive) throw new Error("로그인이 필요합니다.");
    const key = [room, id];
    const existing = records.get(keyFor("photo", key));
    if (existing) return existing;
    const path = home.id + "/references/" + id;
    const uploaded = await bucket.upload(path, image, { contentType: image.type, upsert: false });
    if (uploaded.error) {
      if (String(uploaded.error.statusCode ?? uploaded.error.status) !== "409" &&
          !/duplicate|already exists/i.test(uploaded.error.message ?? "")) throw uploaded.error;
      await requireData(bucket.download(path));
    }
    // A failed metadata write can be retried using the same object identifier.
    return write("photo", key, { path, created, deleted: false });
  }

  return {
    user,
    write,
    sync,
    addPhoto: uploadPhoto,
    download: path => requireData(bucket.download(path)),
    async deletePhoto(row) {
      await write("photo", row.record_key, { ...row.payload, deleted: true });
      const removed = await bucket.remove([row.payload.path]);
      return !removed.error;
    },
    async start() {
      channel = client.channel("checklist-" + home.id)
        .on("postgres_changes", { event: "*", schema: "public", table: "home_records", filter: "home_id=eq." + home.id },
          change => receive([change.new]))
        .subscribe(status => {
          if (!alive) return;
          realtime = status === "SUBSCRIBED";
          if (realtime) recover();
          else onStatus("실시간 연결을 다시 확인하고 있어요.");
        });
      window.addEventListener("online", recover);
      document.addEventListener("visibilitychange", recover);
      interval = setInterval(() => { if (!document.hidden) recover(); }, 20000);
      await sync();
    },
    close() {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("online", recover);
      document.removeEventListener("visibilitychange", recover);
      if (channel) void client.removeChannel(channel);
    }
  };
}

export function dataUrlBlob(source) {
  const data = /^data:(image\/(?:png|webp|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(source);
  if (!data) throw new Error("지원하는 사진 형식은 JPG, PNG, WebP입니다.");
  const bytes = Uint8Array.from(atob(data[2]), character => character.charCodeAt(0));
  if (bytes.length > 5 * 1024 * 1024) throw new Error("사진이 5MB를 넘습니다.");
  return new Blob([bytes], { type: data[1] });
}

export function parseBackup(text) {
  const json = /<script\s+id="embeddedState"\s+type="application\/json">([\s\S]*?)<\/script>/i.exec(text)?.[1] ?? text;
  const backup = JSON.parse(json);
  if (!backup?.data || !backup.photos || typeof backup.data.entries !== "object" ||
      !backup.data.entries || !Array.isArray(backup.data.rooms) || typeof backup.photos !== "object") {
    throw new Error("사진 포함 HTML 백업을 선택해 주세요.");
  }
  return backup;
}

export async function importedPhotoId(room, source, occurrence) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([room, occurrence, source])));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
