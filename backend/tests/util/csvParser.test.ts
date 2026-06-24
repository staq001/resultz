import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { Readable } from "node:stream";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { parser } from "../../src/utils/csvParser";

function csvFile(contents: string) {
  return {
    createReadStream: () => Readable.from([contents]),
  };
}

beforeEach(() => {
  dbMock.__clear();
});

afterEach(() => {
  dbMock.__clear();
});

describe("csvParser", () => {
  it("uses the queued job type and skips duplicate departments in the same file", async () => {
    dbMock.__setSelectResults([[], [], []]);

    const stats = await parser(
      csvFile(
        [
          "name,faculty",
          "Computer Science,Science",
          "Mathematics,Science",
          "computer science,science",
        ].join("\n"),
      ),
      "departments",
    );

    expect(stats).toEqual({
      processed: 3,
      skipped: 1,
      inserted: {
        departments: 2,
        courses: 0,
        scores: 0,
      },
    });

    const [insert] = dbMock.__getInserts();
    expect(insert.values).toHaveLength(2);
    expect(insert.values[0]).toEqual({
      name: "Computer Science",
      faculty: "Science",
    });
  });

  it("preloads score context and skips duplicate scores in the same file", async () => {
    dbMock.__setQueryResult("courses", { id: "course-1" });
    dbMock.__setSelectResults([
      [
        {
          registrationId: "registration-1",
          userId: "user-1",
          matricNo: "MAT001",
          semester: "semester-1",
        },
        {
          registrationId: "registration-2",
          userId: "user-2",
          matricNo: "MAT002",
          semester: "semester-1",
        },
      ],
      [],
    ]);

    const stats = await parser(
      csvFile(
        [
          "matric_no,testScore,examScore",
          "MAT001,20,60",
          "MAT001,25,55",
          "MAT002,15,40",
        ].join("\n"),
      ),
      "scores",
      {
        courseCode: "CSC101",
        semesterId: "semester-1",
      },
    );

    expect(stats).toEqual({
      processed: 3,
      skipped: 1,
      inserted: {
        departments: 0,
        courses: 0,
        scores: 2,
      },
    });

    const [insert] = dbMock.__getInserts();
    expect(insert.values).toHaveLength(2);
    expect(insert.values.map((score: any) => score.userId)).toEqual([
      "user-1",
      "user-2",
    ]);
  });
});
