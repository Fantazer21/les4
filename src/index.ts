import * as express from 'express';
import { Express } from 'express';
import { blogsRouter } from './routes/blogs/router';
import { testingRouter } from './routes/testing/router';
import { postsRouter } from './routes/posts/router';
import { runDb } from './db/connectionDB';
import { authRouter } from './routes/auth/router';
import { usersRouter } from './routes/users/router';

const app: Express = express.default();
const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use('/', blogsRouter);
app.use('/', testingRouter);
app.use('/', postsRouter);
app.use('/', authRouter);
app.use('/', usersRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

runDb();
