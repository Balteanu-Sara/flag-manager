import { v4 as uuidv4 } from "uuid";

function isLogged() {}

function registerUser(req, res) {}

function createAdminRequest(req, res) {}

function login(req, res) {}

function logout(req, res) {}

function showMetadata(req, res) {}

function changeMetadata(req, res, field) {}

function deleteAccount(req, res) {}

export {
  registerUser,
  createAdminRequest,
  login,
  logout,
  showMetadata,
  changeMetadata,
  deleteAccount,
};
