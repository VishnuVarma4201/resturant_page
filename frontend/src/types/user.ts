export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const transformUser = (user: any): UserResponse => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role
});
