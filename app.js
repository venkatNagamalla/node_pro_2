const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Starting server at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjIntoResponseObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

const hasStatus = (requestedQuery) => {
  return requestedQuery.status !== undefined;
};

const hasPriority = (requestedQuery) => {
  return requestedQuery.priority !== undefined;
};

const hasPriorityAndStatus = (requestedQuery) => {
  return (
    requestedQuery.priority !== undefined && requestedQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestedQuery) => {
  return (
    requestedQuery.category !== undefined && requestedQuery.status !== undefined
  );
};

const hasCategory = (requestedQuery) => {
  return requestedQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestedQuery) => {
  return (
    requestedQuery.category !== undefined &&
    requestedQuery.priority !== undefined
  );
};

const hasSearch = (requestedQuery) => {
  return requestedQuery.search_q !== undefined;
};

//api-1
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let getTodoQuery = null;
  let data = null;
  switch (true) {
    //only status
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
            SELECT * FROM todo WHERE status = '${status}';
          `;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //only priority
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getPriorityQuery = `
               SELECT * FROM todo WHERE priority = '${priority}';
            `;
        data = await db.all(getPriorityQuery);
        response.send(
          data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //priority and status
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                  SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';
                `;
          data = await db.all(getTodoQuery);
          response.send(
            data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //category and status
    case hasCategoryAndStatus(request.query):
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
            SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';
         `;
          data = await db.all(getTodoQuery);
          response.send(
            data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //only category
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
               SELECT * FROM todo WHERE category = '${category}';
            `;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //category and priority
    case hasCategoryAndPriority(request.query):
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          getTodoQuery = `
            SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';
        `;
          data = await db.all(getTodoQuery);
          response.send(
            data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //search query
    case hasSearch(request.query):
      getTodoQuery = `
          SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
        `;
      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
      );

      break;

    default:
      getTodoQuery = `
          SELECT * FROM todo;
        `;
      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
      );
      break;
  }
});

//api-2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getSingleTodoQuery = `
       SELECT * FROM todo WHERE id = ${todoId};
    `;
  const todo = await db.get(getSingleTodoQuery);
  response.send(convertDbObjIntoResponseObj(todo));
});

//api-3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
       SELECT * FROM todo WHERE due_date = '${newDate}';
    `;
    const todoArray = await db.all(getTodoQuery);
    response.send(
      todoArray.map((eachTodo) => convertDbObjIntoResponseObj(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api-4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addingANewQuery = `
                INSERT INTO todo (id, todo, priority, status, category, due_date)
                VALUES (
                    ${id},
                    '${todo}',
                    '${priority}',
                    '${status}',
                    '${category}',
                    '${newDate}'
       );
    `;
          await db.run(addingANewQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//api-5
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  const getTodo = `
     SELECT * FROM todo WHERE id = ${todoId};
    `;
  const preTodo = await db.get(getTodo);

  const {
    todo = preTodo.todo,
    priority = preTodo.priority,
    status = preTodo.status,
    category = preTodo.category,
    dueDate = preTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    //status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                  UPDATE todo
                  SET 
                  status = '${status}'
                  WHERE id = ${todoId};
              `;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
                  UPDATE todo
                  SET 
                  priority = '${priority}'
                  WHERE id = ${todoId};
              `;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
                  UPDATE todo
                  SET 
                  category = '${category}'
                  WHERE id = ${todoId};
              `;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                  UPDATE todo
                  SET 
                  due_date = '${newDate}'
                  WHERE id = ${todoId};
              `;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      updateTodoQuery = `
           UPDATE todo 
           SET todo = '${todo}'
           WHERE id = ${todoId};
        `;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//api-6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
       DELETE FROM todo WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
