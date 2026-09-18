const TOKEN_KEY = 'nas_auth_token';
const USER_KEY = 'nas_user_info';

export const auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  },
  setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

export async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, recaptcha: '' })
  });

  if (!response.ok) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }

  const token = await response.text();
  // Decode JWT payload for user info
  let user = { username };
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    user = payload.user || { username };
  } catch (e) {
    // fallback
  }

  auth.setAuth(token, user);
  return { token, user };
}

export async function fetchResources(dirPath = '/') {
  const token = auth.getToken();
  const cleanPath = dirPath.startsWith('/') ? dirPath : `/${dirPath}`;
  const response = await fetch(`/api/resources${cleanPath}`, {
    headers: {
      'X-Auth': token || ''
    }
  });

  if (response.status === 401 || response.status === 403) {
    auth.clear();
    throw new Error('Hết phiên đăng nhập. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    throw new Error(`Không thể lấy danh sách tệp (${response.status})`);
  }

  return await response.json();
}

export async function uploadFile(targetDirPath, file, onProgress) {
  const token = auth.getToken();
  const dir = targetDirPath.endsWith('/') ? targetDirPath : `${targetDirPath}/`;
  const filePath = `${dir}${encodeURIComponent(file.name)}?override=true`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/resources${filePath}`);
    xhr.setRequestHeader('X-Auth', token || '');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Tải lên thất bại: Mã lỗi ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải lên.'));
    xhr.send(file);
  });
}

export async function createFolder(targetDirPath, folderName) {
  const token = auth.getToken();
  const dir = targetDirPath.endsWith('/') ? targetDirPath : `${targetDirPath}/`;
  const path = `${dir}${encodeURIComponent(folderName)}/?override=false`;

  const res = await fetch(`/api/resources${path}`, {
    method: 'POST',
    headers: { 'X-Auth': token || '' }
  });

  if (!res.ok) {
    throw new Error('Tạo thư mục thất bại.');
  }
}

export async function deleteResource(path) {
  const token = auth.getToken();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`/api/resources${cleanPath}`, {
    method: 'DELETE',
    headers: { 'X-Auth': token || '' }
  });

  if (!res.ok) {
    throw new Error('Xóa tệp/thư mục thất bại.');
  }
}

export async function renameResource(oldPath, newName) {
  const token = auth.getToken();
  const cleanOld = oldPath.startsWith('/') ? oldPath : `/${oldPath}`;
  const parentDir = cleanOld.substring(0, cleanOld.lastIndexOf('/')) || '/';
  const newPath = `${parentDir === '/' ? '' : parentDir}/${newName}`;

  const res = await fetch(`/api/resources${cleanOld}?destination=${encodeURIComponent(newPath)}&rename=true`, {
    method: 'PATCH',
    headers: { 'X-Auth': token || '' }
  });

  if (!res.ok) {
    throw new Error('Đổi tên thất bại.');
  }
}

export function getRawUrl(path) {
  const token = auth.getToken();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/api/raw${cleanPath}?auth=${encodeURIComponent(token || '')}`;
}

export async function fetchTelemetry() {
  const res = await fetch('/api/system/telemetry');
  if (!res.ok) {
    throw new Error('Không thể đọc dữ liệu telemetry');
  }
  return await res.json();
}
