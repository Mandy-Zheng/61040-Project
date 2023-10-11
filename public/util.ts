type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  //Session
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  // User
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  // Resume
  {
    name: "Create Resume",
    endpoint: "/api/resume",
    method: "POST",
    fields: { name: "input", field: "input", work: "json", school: "json" },
  },
  {
    name: "Get Resumes By User (empty for all)",
    endpoint: "/api/resume/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Update Resume",
    endpoint: "/api/resume",
    method: "PATCH",
    fields: { id: "input", update: { name: "input", field: "input", work: "json", school: "json" } },
  },
  {
    name: "Delete Resume",
    endpoint: "/api/resume/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Experts by Field and Rating",
    endpoint: "/api/resume/experts/:field/:minimumRating",
    method: "GET",
    fields: { field: "input", minimumRating: "input" }, //TODO
  },

  // Validation (Resume)
  {
    name: "Get Resume Validations By Id",
    endpoint: "/api/validation/resume/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Approve Resume by Resume Id",
    endpoint: "/api/validation/approval/resume/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Disapprove Resume by Resume Id",
    endpoint: "/api/validation/disapproval/resume/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Undo Validation for Resume by Resume Id",
    endpoint: "/api/validation/undoValidation/resume/:id",
    method: "PATCH",
    fields: { id: "input" },
  },

  // ExclusivePost
  {
    name: "Create Exclusive Post",
    endpoint: "/api/exclusivepost",
    method: "POST",
    fields: { title: "input", content: "input", audience: "json", tags: "json" },
  },
  {
    name: "Get Viewable Posts By Id (empty for all)",
    endpoint: "/api/exclusivepost/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Get Viewable Posts By Author",
    endpoint: "/api/exclusivepost/author/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Delete Post",
    endpoint: "/api/exclusivepost/:id",
    method: "DELETE",
    fields: { id: "input" },
  },

  // Validation (Exclusive Post)
  {
    name: "Get Exclusive Post Validations",
    endpoint: "/api/validation/exclusivepost/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Get Approvers with Rating for Post",
    endpoint: "/api/validation/approval/exclusivepost/:id",
    method: "GET",
    fields: { id: "input" }, //TODO
  },
  {
    name: "Get Disapprovers with Rating for Post",
    endpoint: "/api/validation/disapproval/exclusivepost/:id",
    method: "GET",
    fields: { id: "input" }, //TODO
  },
  {
    name: "Approve Exclusive Post by Post Id",
    endpoint: "/api/validation/approval/exclusivepost/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Disapprove Exclusive Post by Post Id",
    endpoint: "/api/validation/disapproval/exclusivepost/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Undo Validation for Exclusive Post by Post Id",
    endpoint: "/api/validation/undoValidation/exclusivepost/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  // Annotations
  {
    name: "Create Annotation",
    endpoint: "/api/annotation/exclusivepost",
    method: "POST",
    fields: { postId: "input", comment: "input", quote: "input" },
  },
  {
    name: "Get Annotation For Viewable Post",
    endpoint: "/api/annotation/exclusivepost/:postId",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Get My Annotations",
    endpoint: "/api/annotation/myAnnotations",
    method: "GET",
    fields: {},
  },
  {
    name: "Update Annotation",
    endpoint: "/api/annotation",
    method: "PATCH",
    fields: { id: "input", update: { comment: "input", quote: "input" } },
  },
  {
    name: "Delete Annotation",
    endpoint: "/api/annotation/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Top N Reviewers",
    endpoint: "/api/annotation/:top",
    method: "GET",
    fields: { top: "input" }, //TODO CHECK NUMBER
  },

  // Dependency Map
  {
    name: "Create Dependency Map",
    endpoint: "/api/depmap",
    method: "POST",
    fields: { title: "input", tags: "json", deps: "json" },
  },
  {
    name: "Get Dependency Maps (empty for all)",
    endpoint: "/api/depmap/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Update Dependency Maps",
    endpoint: "/api/depmap",
    method: "PATCH",
    fields: { id: "input", update: { title: "input", tags: "json", deps: "json" } },
  },
  {
    name: "Delete Dependency Maps",
    endpoint: "/api/depmap/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Maps with Prerequisites for a Post",
    endpoint: "/api/depmap/postprerequisite/:postId",
    method: "GET",
    fields: { postId: "input" },
  },
  //========================
  {
    name: "Get Fully Viewable Dependency Maps",
    endpoint: "/api/users/depmap/viewableMaps",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Popular Dependency Maps",
    endpoint: "/api/validation/depmap/popular",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Maps By Topic",
    endpoint: "/api/depmap/topics/:topic",
    method: "GET",
    fields: { topic: "input" },
  },

  // Validation (Dependency Map)
  {
    name: "Get Dependency Map Validations (empty for all)",
    endpoint: "/api/validation/depmap/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Approve Dependency Map by Map Id",
    endpoint: "/api/validation/approval/depmap/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Disaprove Dependency Map by Map Id",
    endpoint: "/api/validation/disapproval/depmap/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Undo Validation for Dependency Map by Map Id",
    endpoint: "/api/validation/undoValidation/depmap/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json" && val.toString() !== "") {
      reqData[key] = JSON.parse(val.toString());
    }
    console.log(typeof key, reqData[key]);
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);
  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
