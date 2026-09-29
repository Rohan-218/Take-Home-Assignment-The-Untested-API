const request = require("supertest");
const app = require("../src/app");
const taskService = require("../src/services/taskService");

describe("Task API", () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe("GET /tasks", () => {

    test("should return an empty array when there are no tasks", async () => {
      const response = await request(app).get("/tasks");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should return all tasks", async () => {
      taskService.create({ title: "Task 1" });
      taskService.create({ title: "Task 2" });

      const response = await request(app).get("/tasks");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test("should filter tasks by status", async () => {
      taskService.create({
        title: "Todo task",
        status: "todo",
      });

      taskService.create({
        title: "Done task",
        status: "done",
      });

      const response = await request(app).get("/tasks?status=todo");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("todo");
    });

    test("should return empty array when no tasks match the status", async () => {
      taskService.create({
        title: "Todo task",
        status: "todo",
      });

      const response = await request(app).get("/tasks?status=done");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should support pagination", async () => {
      taskService.create({ title: "Task 1" });
      taskService.create({ title: "Task 2" });
      taskService.create({ title: "Task 3" });

      const response = await request(app).get("/tasks?page=1&limit=2");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);

      expect(response.body[0].title).toBe("Task 1");
      expect(response.body[1].title).toBe("Task 2");
    });

    test("should return empty array for a page beyond available tasks", async () => {
      taskService.create({ title: "Task 1" });

      const response = await request(app).get("/tasks?page=10&limit=2");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("POST /tasks", () => {
    test("should create a task", async () => {
      const response = await request(app).post("/tasks").send({
        title: "Learn Jest",
        description: "Write tests",
        priority: "high",
      });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe("Learn Jest");
      expect(response.body.description).toBe("Write tests");
      expect(response.body.priority).toBe("high");
      expect(response.body.status).toBe("todo");
    });

    test("should create a task with all valid fields", async () => {
      const response = await request(app).post("/tasks").send({
        title: "Complete assignment",
        description: "Finish tests",
        status: "in_progress",
        priority: "high",
        dueDate: "2030-01-01T00:00:00.000Z",
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("in_progress");
      expect(response.body.priority).toBe("high");
      expect(response.body.dueDate).toBe("2030-01-01T00:00:00.000Z");
    });

    test("should reject a missing title", async () => {
      const response = await request(app).post("/tasks").send({
        description: "No title",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "title is required and must be a non-empty string",
      );
    });

    test("should reject an empty title", async () => {
      const response = await request(app).post("/tasks").send({
        title: "",
      });

      expect(response.status).toBe(400);
    });

    test("should reject a whitespace-only title", async () => {
      const response = await request(app).post("/tasks").send({
        title: "   ",
      });

      expect(response.status).toBe(400);
    });

    test("should reject an invalid status", async () => {
      const response = await request(app).post("/tasks").send({
        title: "Invalid status",
        status: "finished",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("status must be one of");
    });

    test("should reject an invalid priority", async () => {
      const response = await request(app).post("/tasks").send({
        title: "Invalid priority",
        priority: "urgent",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("priority must be one of");
    });

    test("should reject an invalid due date", async () => {
      const response = await request(app).post("/tasks").send({
        title: "Invalid date",
        dueDate: "not-a-date",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "dueDate must be a valid ISO date string",
      );
    });
  });

  describe("PUT /tasks/:id", () => {
    test("should update an existing task", async () => {
      const task = taskService.create({
        title: "Old title",
        priority: "low",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        title: "New title",
        priority: "high",
      });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("New title");
      expect(response.body.priority).toBe("high");
    });

    test("should support partial updates", async () => {
      const task = taskService.create({
        title: "Original",
        description: "Keep this",
        priority: "high",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        title: "Updated",
      });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated");
      expect(response.body.description).toBe("Keep this");
      expect(response.body.priority).toBe("high");
    });

    test("should update status", async () => {
      const task = taskService.create({
        title: "Task",
        status: "todo",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        status: "in_progress",
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("in_progress");
    });

    test("should return 404 for a non-existent task", async () => {
      const response = await request(app).put("/tasks/does-not-exist").send({
        title: "Updated",
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    test("should reject an empty title", async () => {
      const task = taskService.create({
        title: "Original",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        title: "",
      });

      expect(response.status).toBe(400);
    });

    test("should reject an invalid status", async () => {
      const task = taskService.create({
        title: "Original",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        status: "finished",
      });

      expect(response.status).toBe(400);
    });

    test("should reject an invalid priority", async () => {
      const task = taskService.create({
        title: "Original",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        priority: "urgent",
      });

      expect(response.status).toBe(400);
    });

    test("should reject an invalid due date", async () => {
      const task = taskService.create({
        title: "Original",
      });

      const response = await request(app).put(`/tasks/${task.id}`).send({
        dueDate: "invalid-date",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /tasks/:id", () => {
    test("should delete an existing task", async () => {
      const task = taskService.create({
        title: "Delete me",
      });

      const response = await request(app).delete(`/tasks/${task.id}`);

      expect(response.status).toBe(204);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test("should return 404 for a non-existent task", async () => {
      const response = await request(app).delete("/tasks/does-not-exist");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    test("should delete only the requested task", async () => {
      const task1 = taskService.create({ title: "Task 1" });
      const task2 = taskService.create({ title: "Task 2" });

      await request(app).delete(`/tasks/${task1.id}`);

      expect(taskService.findById(task1.id)).toBeUndefined();
      expect(taskService.findById(task2.id)).toBeDefined();
    });
  });

  describe("PATCH /tasks/:id/complete", () => {
    test("should mark a task as complete", async () => {
      const task = taskService.create({
        title: "Complete me",
        status: "in_progress",
      });

      const response = await request(app).patch(`/tasks/${task.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("done");
      expect(response.body.completedAt).toBeDefined();
    });

    test("should return 404 for a non-existent task", async () => {
      const response = await request(app).patch(
        "/tasks/does-not-exist/complete",
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    test("should preserve priority when completing a task", async () => {
      const task = taskService.create({
        title: "High priority",
        priority: "high",
      });

      const response = await request(app).patch(`/tasks/${task.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe("high");
    });
  });

  describe("GET /tasks/stats", () => {
    test("should return zero statistics when there are no tasks", async () => {
      const response = await request(app).get("/tasks/stats");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
      });
    });

    test("should return counts by status", async () => {
      taskService.create({
        title: "Todo",
        status: "todo",
      });

      taskService.create({
        title: "In progress",
        status: "in_progress",
      });

      taskService.create({
        title: "Done",
        status: "done",
      });

      const response = await request(app).get("/tasks/stats");

      expect(response.status).toBe(200);
      expect(response.body.todo).toBe(1);
      expect(response.body.in_progress).toBe(1);
      expect(response.body.done).toBe(1);
    });

    test("should count overdue unfinished tasks", async () => {
      taskService.create({
        title: "Overdue",
        status: "todo",
        dueDate: "2020-01-01T00:00:00.000Z",
      });

      const response = await request(app).get("/tasks/stats");

      expect(response.status).toBe(200);
      expect(response.body.overdue).toBe(1);
    });

    test("should not count completed overdue tasks", async () => {
      taskService.create({
        title: "Completed",
        status: "done",
        dueDate: "2020-01-01T00:00:00.000Z",
      });

      const response = await request(app).get("/tasks/stats");

      expect(response.status).toBe(200);
      expect(response.body.overdue).toBe(0);
    });
  });
});
