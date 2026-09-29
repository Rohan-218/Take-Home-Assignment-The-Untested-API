# Task API — Bug Report and Test Summary

## 1. Overview

As part of the take-home assignment, I first reviewed the Task Manager API source code and **manually tested the API endpoints using Postman**. This helped me understand the existing API behavior and identify issues before writing automated tests.

After the initial **Postman testing**, I added unit tests for the task service using Jest and integration tests for the API routes using Supertest. The tests covered task creation, retrieval, filtering, pagination, updating, deletion, completion, statistics, validation, and edge cases.

During testing and source-code review, I identified three bugs. I initially documented the bugs without changing the implementation, then fixed them and updated the affected tests.

### Use of AI Assistance

AI assistance was used mainly to organize and present this report clearly.

The core work was completed by me, including source-code review, **manual API testing using Postman**, writing and running Jest/Supertest tests, analyzing failures, identifying bugs, implementing fixes, and updating tests.

---

# 2. Bugs Identified

## Bug 1 — Completing a Task Changes Its Priority

**Location:** `taskService.js`

### Expected Behavior

When a task is completed using:

`PATCH /tasks/:id/complete`

the task status should change to `done` and `completedAt` should be added, while the existing priority should remain unchanged.

For example, a high-priority task should remain high priority after completion.

### Actual Behavior

The original implementation contained:

```js
const updated = {
  ...task,
  priority: 'medium',
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

This caused every completed task to have its priority changed to `medium`.

For example:

`high → medium`

### How It Was Found

I **first found this issue during manual API testing in Postman**.

While testing the task completion endpoint, I noticed that completing a task unexpectedly changed its priority. I then reproduced the issue with a unit test to confirm the behavior.

### Test Used

```js
const task = taskService.create({
  title: "High priority task",
  priority: "high",
});

const completed = taskService.completeTask(task.id);

expect(completed.priority).toBe("high");
```

The test failed because the returned priority was `medium` instead of `high`.

### Fix

The unnecessary priority assignment was removed:

```js
const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

The task now keeps its original priority when completed.

---

## Bug 2 — Status Filtering Uses Partial Matching

**Location:** `taskService.js`

### Expected Behavior

Status filtering should return tasks with an **exact matching status**.

For example:

`status=todo`

should only return tasks whose status is exactly `todo`.

### Actual Behavior

The original implementation used:

```js
const getByStatus = (status) =>
  tasks.filter((t) => t.status.includes(status));
```

Because `includes()` performs partial matching, values that are only part of a status could also return results.

Examples:

* `"do"` can match `todo` and `done`
* `"to"` can match `todo`
* `"o"` can match multiple valid statuses

### How It Was Found

I **found this issue during manual testing of the status filtering endpoint in Postman** by testing different status values.

The endpoint worked correctly when a complete status such as `todo` was provided, but partial status values could also return tasks.

I then reviewed the service implementation and identified the use of `includes()` as the cause.

### Fix

The filtering logic was changed to use an exact comparison:

```js
const getByStatus = (status) =>
  tasks.filter((t) => t.status === status);
```

Now only tasks with the exact requested status are returned.

---

## Bug 3 — Pagination Skips the First Page

**Location:** `taskService.js`

### Expected Behavior

The API documentation uses **1-based page numbering**.

For example, with a limit of 2:

| Page | Expected Tasks |
| ---- | -------------- |
| 1    | Task 1, Task 2 |
| 2    | Task 3, Task 4 |
| 3    | Task 5         |

### Actual Behavior

The original implementation calculated the offset as:

```js
const offset = page * limit;
```

For page 1 and limit 2:

```text
offset = 1 × 2
offset = 2
```

Therefore, page 1 started from Task 3 instead of Task 1.

### How It Was Found

I **first found this issue during manual pagination testing in Postman**.

While testing page 1 with a limit of 2, the API returned the second set of tasks instead of the first set.

I then created an automated test based on the documented 1-based page numbering, which reproduced the issue.

### Test Used

```js
const tasks = taskService.getPaginated(1, 2);

expect(tasks[0].title).toBe("Task 1");
```

The test failed because the implementation returned Task 3 as the first task.

### Fix

The offset calculation was changed to:

```js
const offset = (page - 1) * limit;
```

This correctly supports 1-based page numbering.

---

# 3. Test Updates

The tests were updated to verify the corrected behavior.

### Pagination

```js
getPaginated(1, 2) // Task 1, Task 2
getPaginated(2, 2) // Task 3, Task 4
getPaginated(3, 2) // Task 5
```

### Task Completion

A test was added to make sure completing a high-priority task does not change its priority.

---

# 4. Testing Approach

## 1. Manual API Testing — Postman

I started by **testing the API endpoints manually using Postman**.

This helped me understand:

* Request formats
* Response formats
* HTTP status codes
* Validation behavior
* API flow
* Unexpected behavior

The three bugs documented in this report were **first identified during Postman testing**.

## 2. Unit Tests — Jest

Unit tests were written for the task service functions, including:

* `create`
* `getAll`
* `findById`
* `getByStatus`
* `getPaginated`
* `update`
* `remove`
* `completeTask`
* `getStats`
* `_reset`

## 3. Integration Tests — Supertest

Integration tests were written to test the API routes and verify:

* HTTP status codes
* Request and response handling
* Validation
* Error handling
* Task creation
* Task modification
* Task deletion
* Filtering
* Pagination
* Task completion

---

# 5. Test Results

Final test run:

* **Test suites:** 2 passed
* **Tests:** 62 passed
* **Failed tests:** 0

The final test run confirmed that the fixes passed and the existing functionality continued to work.

---

# 6. How the Bugs Were Discovered

The bugs were identified using a combination of **manual Postman testing, source-code review, and automated testing**.

The overall process was:

1. Review the source code.
2. **Manually test API endpoints using Postman.**
3. Understand the expected API behavior.
4. Test normal scenarios and edge cases.
5. Notice unexpected API behavior.
6. Review the related source code.
7. Identify and document the bugs.
8. Write automated tests to reproduce the issues.
9. Fix the implementation.
10. Update the affected tests.
11. Run the complete test suite again.

### Bug Discovery Summary

* **Priority bug:** Found during Postman testing of task completion.
* **Status filtering bug:** Found during Postman testing with different status values.
* **Pagination bug:** Found during Postman testing of different page and limit values.

Automated tests were then used to reproduce and verify each issue.

---

# 7. Questions Before Shipping

Some areas I would clarify or test further before considering the API production-ready:

### Pagination

* Should `page` start at 1?
* What should happen for invalid or negative page values?
* What should happen when the requested page does not exist?
* Should the API return pagination metadata?

### Task Status

* Should status values be case-sensitive?
* What should happen for an invalid status?
* What should happen if a completed task is completed again?

### Validation

* Should there be maximum lengths for task fields?
* Should whitespace-only values be rejected?
* What date formats should be accepted?
* How should invalid dates be handled?

### Production

* Should tasks remain in memory or use a database?
* Is authentication required?
* Is authorization required?
* Should the API use a standard error response format?
* What logging and monitoring would be required?

---

# 8. What I Would Test Next

If I had more time, I would add tests for:

* Invalid pagination values
* Negative page and limit values
* Empty and whitespace-only fields
* Invalid status values
* Invalid priority values
* Invalid dates
* Completing an already completed task
* Updating a non-existent task
* Deleting a non-existent task
* Boundary cases for statistics
* Consistent API error responses

---

# 9. What Surprised Me

The main thing that stood out was that some issues were not obvious from the normal happy path.

For example, `includes()` appeared to work correctly when testing a complete status such as `todo`, but it also allowed partial values to match.

Similarly, the pagination implementation worked when thinking in zero-based page numbers, but the API documentation expected pages to start at 1.

The **initial Postman testing followed by automated testing** showed the value of using both approaches. Postman helped me quickly understand the API behavior and discover unexpected results, while automated tests made it easier to reproduce the issues and verify the fixes consistently.

---

# 10. Summary

The API was first tested manually using **Postman**, followed by automated unit and integration testing with **Jest and Supertest**.

Three issues were identified involving:

1. Task completion changing priority
2. Status filtering using partial matching
3. Pagination skipping the first set of tasks

All three bugs were **first identified during Postman testing**, then reproduced through automated tests.

The bugs were documented, fixed, and covered by updated tests.

The final test run passed **62 tests across 2 test suites**, with no failures.

The testing process also highlighted several requirements that should be clarified before deploying the API to production.
