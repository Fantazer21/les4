export enum ApiPaths {
  Blogs = '/blogs',
  BlogById = '/blogs/:id',
  Posts = '/posts',
  PostById = '/posts/:id',
  TestingAllData = '/testing/all-data',
  Login = '/auth/login',
  Registration = '/auth/registration',
  RegistrationConfirmation = '/auth/registration-confirmation',
  RegistrationEmailResending = '/auth/registration-email-resending',
  Me = '/auth/me',
  Users = '/users',
  UserById = '/users/:id',
  PostComments = '/posts/:postId/comments',
  CommentById = '/comments/:id',
  CommentsByPostId = '/posts/:postId/comments',
  RefreshToken = '/auth/refresh-token',
  Logout = '/auth/logout'
}
