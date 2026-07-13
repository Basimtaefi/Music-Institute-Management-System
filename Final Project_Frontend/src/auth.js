export function loginUser(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
    const text = localStorage.getItem("user");

    if(!text) {
        return null;
    }

    return JSON.parse(text);
}
