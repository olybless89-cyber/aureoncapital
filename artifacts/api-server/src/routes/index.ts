import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import usersRouter from "./users";
import ordersRouter from "./orders";
import emailRouter from "./email";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(usersRouter);
router.use(ordersRouter);
router.use(emailRouter);

export default router;
