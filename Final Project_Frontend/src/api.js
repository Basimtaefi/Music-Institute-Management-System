import { getToken } from './auth'
const BASE_URL = "http://localhost:3000/api";

export async function get(path) {
  var myHeaders = new Headers();

  var token = getToken();
  if (token) {
    myHeaders.append("Authorization", "Bearer " + token);
  }

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(BASE_URL + path, requestOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}


export async function post(path, body) {
  var myHeaders = new Headers()
  myHeaders.append("Content-Type", "application/json")

  var token = getToken()
  if (token) {
    myHeaders.append("Authorization", "Bearer " + token)
  }

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  }

  const response = await fetch(BASE_URL + path, requestOptions)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message)
  }

  return data
}

export async function put(path, body) {
  var myHeaders = new Headers()
  myHeaders.append("Content-Type", "application/json")

  var token = getToken()
  if (token) {
    myHeaders.append("Authorization", "Bearer " + token)
  }

  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  }

  const response = await fetch(BASE_URL + path, requestOptions)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message)
  }

  return data
}

export async function del(path) {
  var myHeaders = new Headers()

  var token = getToken()
  if (token) {
    myHeaders.append("Authorization", "Bearer " + token)
  }

  var requestOptions = {
    method: "DELETE",
    headers: myHeaders,
    redirect: "follow",
  }

  const response = await fetch(BASE_URL + path, requestOptions)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message)
  }

  return data
}
