const taskService = require("../src/services/taskService");

describe("Task Service", () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe("create()", () => {
    test("should create a task with default values", () => {
      const task = taskService.create({
        title: "Learn Jest",
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe("Learn Jest");
      expect(task.description).toBe("");
      expect(task.status).toBe("todo");
      expect(task.priority).toBe("medium");
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    test("should create a task with all provided fields", () => {
      const task = taskService.create({
        title: "Complete assignment",
        description: "Write tests",
        status: "in_progress",
        priority: "high",
        dueDate: "2030-01-01T00:00:00.000Z",
      });

      expect(task.title).toBe("Complete assignment");
      expect(task.description).toBe("Write tests");
      expect(task.status).toBe("in_progress");
      expect(task.priority).toBe("high");
      expect(task.dueDate).toBe("2030-01-01T00:00:00.000Z");
    });

    test("should create multiple tasks with different IDs", () => {
      const task1 = taskService.create({ title: "Task 1" });
      const task2 = taskService.create({ title: "Task 2" });

      expect(task1.id).not.toBe(task2.id);
      expect(taskService.getAll()).toHaveLength(2);
    });
  });

  describe("getAll()", () => {
    test("should return all tasks", () => {
      taskService.create({ title: "Task 1" });
      taskService.create({ title: "Task 2" });

      const tasks = taskService.getAll();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Task 1");
      expect(tasks[1].title).toBe("Task 2");
    });

    test("should return an empty array when there are no tasks", () => {
      expect(taskService.getAll()).toEqual([]);
    });
  });

  describe("findById()", () => {
    test("should find a task by ID", () => {
      const createdTask = taskService.create({
        title: "Find me",
      });

      const task = taskService.findById(createdTask.id);

      expect(task).toBeDefined();
      expect(task.id).toBe(createdTask.id);
    });

    test("should return undefined for a non-existent ID", () => {
      const task = taskService.findById("does-not-exist");

      expect(task).toBeUndefined();
    });
  });

  describe("getByStatus()", () => {
    test("should return todo tasks", () => {
      taskService.create({
        title: "Todo task",
        status: "todo",
      });

      taskService.create({
        title: "Done task",
        status: "done",
      });

      const tasks = taskService.getByStatus("todo");

      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe("todo");
    });

    test("should return in_progress tasks", () => {
      taskService.create({
        title: "In progress",
        status: "in_progress",
      });

      const tasks = taskService.getByStatus("in_progress");

      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe("in_progress");
    });

    test("should return done tasks", () => {
      taskService.create({
        title: "Done",
        status: "done",
      });

      const tasks = taskService.getByStatus("done");

      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe("done");
    });

    test("should return an empty array when no task matches", () => {
      taskService.create({
        title: "Todo task",
        status: "todo",
      });

      expect(taskService.getByStatus("done")).toEqual([]);
    });
  });

  describe("getPaginated()", () => {
    beforeEach(() => {
      taskService.create({ title: "Task 1" });
      taskService.create({ title: "Task 2" });
      taskService.create({ title: "Task 3" });
      taskService.create({ title: "Task 4" });
      taskService.create({ title: "Task 5" });
    });

    test("should return the requested number of tasks", () => {
      const tasks = taskService.getPaginated(1, 2);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Task 1");
      expect(tasks[1].title).toBe("Task 2");
    });

    test("should return the second page", () => {
      const tasks = taskService.getPaginated(2, 2);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Task 3");
      expect(tasks[1].title).toBe("Task 4");
    });

    test("should return remaining tasks on the last page", () => {
      const tasks = taskService.getPaginated(3, 2);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Task 5");
    });

    test("should return an empty array for a page beyond available tasks", () => {
      const tasks = taskService.getPaginated(10, 2);

      expect(tasks).toEqual([]);
    });
  });

  describe("update()", () => {
    test("should update an existing task", () => {
      const task = taskService.create({
        title: "Old title",
        priority: "low",
      });

      const updated = taskService.update(task.id, {
        title: "New title",
        priority: "high",
      });

      expect(updated.title).toBe("New title");
      expect(updated.priority).toBe("high");
    });

    test("should preserve fields that are not updated", () => {
      const task = taskService.create({
        title: "Original",
        description: "Keep this",
        priority: "high",
      });

      const updated = taskService.update(task.id, {
        title: "Updated",
      });

      expect(updated.title).toBe("Updated");
      expect(updated.description).toBe("Keep this");
      expect(updated.priority).toBe("high");
    });

    test("should return null for a non-existent task", () => {
      const result = taskService.update("does-not-exist", {
        title: "Updated",
      });

      expect(result).toBeNull();
    });
  });

  describe("remove()", () => {
    test("should remove an existing task", () => {
      const task = taskService.create({
        title: "Delete me",
      });

      const result = taskService.remove(task.id);

      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test("should return false for a non-existent task", () => {
      const result = taskService.remove("does-not-exist");

      expect(result).toBe(false);
    });

    test("should remove only the requested task", () => {
      const task1 = taskService.create({ title: "Task 1" });
      const task2 = taskService.create({ title: "Task 2" });

      taskService.remove(task1.id);

      expect(taskService.getAll()).toHaveLength(1);
      expect(taskService.findById(task2.id)).toBeDefined();
    });
  });

  describe("completeTask()", () => {
    test("should mark a task as done", () => {
      const task = taskService.create({
        title: "Complete me",
        status: "in_progress",
      });

      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe("done");
      expect(completed.completedAt).toBeDefined();
    });

    test("should return null for a non-existent task", () => {
      const result = taskService.completeTask("does-not-exist");

      expect(result).toBeNull();
    });

    test("should preserve the task priority when completing it", () => {
      const task = taskService.create({
        title: "High priority task",
        priority: "high",
      });

      const completed = taskService.completeTask(task.id);

      expect(completed.priority).toBe("high");
    });
  });

  describe("getStats()", () => {
    test("should return zero counts when there are no tasks", () => {
      expect(taskService.getStats()).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
      });
    });

    test("should count tasks by status", () => {
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

      const stats = taskService.getStats();

      expect(stats.todo).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(0);
    });

    test("should count overdue unfinished tasks", () => {
      taskService.create({
        title: "Overdue",
        status: "todo",
        dueDate: "2020-01-01T00:00:00.000Z",
      });

      const stats = taskService.getStats();

      expect(stats.overdue).toBe(1);
    });

    test("should not count completed tasks as overdue", () => {
      taskService.create({
        title: "Completed",
        status: "done",
        dueDate: "2020-01-01T00:00:00.000Z",
      });

      const stats = taskService.getStats();

      expect(stats.overdue).toBe(0);
    });

    test("should not count future tasks as overdue", () => {
      taskService.create({
        title: "Future",
        status: "todo",
        dueDate: "2035-01-01T00:00:00.000Z",
      });

      const stats = taskService.getStats();

      expect(stats.overdue).toBe(0);
    });
  });

  describe("_reset()", () => {
    test("should remove all tasks", () => {
      taskService.create({ title: "Task 1" });
      taskService.create({ title: "Task 2" });

      taskService._reset();

      expect(taskService.getAll()).toEqual([]);
    });
  });
});