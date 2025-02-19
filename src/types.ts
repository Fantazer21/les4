export interface BlogInputModel {
  /** Blog name, max length: 15 */
  name: string;

  /** Blog description, max length: 500 */
  description: string;

  /** Blog website URL, max length: 100, should match pattern */
  websiteUrl: string;
}

export interface BlogViewModel {
  /** Blog unique identifier */
  id: string;
  /** Blog name */
  name: string;
  /** Blog description */
  description: string;
  /** Blog website URL */
  websiteUrl: string;
  /** Blog membership status */
  isMembership: boolean;
  /** Blog creation timestamp */
  createdAt: string;
}

export interface PostInputModel {
  /** Post title, max length: 30 */
  title: string;

  /** Post short description, max length: 100 */
  shortDescription: string;

  /** Post content, max length: 1000 */
  content: string;

  /** ID of the blog this post belongs to */
  blogId: string;
}

export interface PostViewModel {
  /** Post unique identifier */
  id: string;

  /** Post title */
  title: string;

  /** Post short description */
  shortDescription: string;

  /** Post content */
  content: string;

  /** ID of the blog this post belongs to */
  blogId: string;

  /** Name of the blog this post belongs to */
  blogName: string;

  /** Creation timestamp */
  createdAt: string;

  /** Membership status */
  isMembership?: boolean;
}

export interface ApiResponse<T = void> {
  status: number;
  data?: T;
  error?: string;
}

export interface BlogsResponse {
  items: BlogViewModel[];
  totalCount: number;
}

export interface ErrorResponse {
  errorsMessages: { message: string; field: string }[];
}
