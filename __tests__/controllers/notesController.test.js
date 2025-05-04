import { getNoteById } from "../../controllers/notesController.js";
import Note from "../../models/Note.js";
import User from "../../models/User.js";

// mock the imported models
jest.mock("../../models/Note.js");

describe("getNoteById", () => {
  it("should return a note with status 200 when a valid ID is provided", async () => {
    // AAA pattern: Arrange, Act, Assert
    // Arrange
    const req = {
      params: {
        id: "validNoteId",
      },
    };

    const res = {
      // jest.fn() is a mock function that can be used to track calls to the function and its arguments
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockNote = {
      _id: "validNoteId",
      title: "Test Note",
      content: "Test Content",
      userId: {
        username: "testUser",
      },
    };

    // Mock Mongoose chaining
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockNote),
    };

    Note.findById.mockImplementation(() => mockQuery);

    // Act
    await getNoteById(req, res);

    // Assert
    expect(Note.findById).toHaveBeenCalledWith("validNoteId");
    expect(mockQuery.populate).toHaveBeenCalledWith({
      path: "userId",
      select: "username",
      model: User,
    });
    expect(mockQuery.lean).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockNote);
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  //   it("should return 404 status when note with provided ID doesn't exist", async () => {
  //     // Arrange
  //     const req = {
  //       params: {
  //         id: "nonExistentNoteId",
  //       },
  //     };

  //     const res = {
  //       status: jest.fn().mockReturnThis(),
  //       json: jest.fn(),
  //     };

  //     // Mock Mongoose chaining
  //     const mockQuery = {
  //       populate: jest.fn().mockReturnThis(),
  //       lean: jest.fn().mockResolvedValue(null),
  //     };
  //     Note.findById.mockImplementation(() => mockQuery);

  //     // Act
  //     await getNoteById(req, res);

  //     // Assert
  //     expect(Note.findById).toHaveBeenCalledWith("nonExistentNoteId");
  //     expect(mockQuery.populate).toHaveBeenCalledWith({
  //       path: "userId",
  //       select: "-password",
  //     });
  //     expect(mockQuery.lean).toHaveBeenCalled();
  //     expect(res.status).toHaveBeenCalledWith(404);
  //     expect(res.json).toHaveBeenCalledWith({ message: "No note found!" });
  //   });

  //   it("should return 500 status when an error occurs", async () => {
  //     // Arrange
  //     const req = {
  //       params: {
  //         id: "validNoteId",
  //       },
  //     };

  //     const res = {
  //       status: jest.fn().mockReturnThis(),
  //       json: jest.fn(),
  //     };

  //     // Mock Mongoose chaining to throw an error
  //     const mockQuery = {
  //       populate: jest.fn().mockReturnThis(),
  //       lean: jest.fn().mockRejectedValue(new Error("Database error")),
  //     };
  //     Note.findById.mockImplementation(() => mockQuery);

  //     // Act
  //     await getNoteById(req, res);

  //     // Assert
  //     expect(Note.findById).toHaveBeenCalledWith("validNoteId");
  //     expect(mockQuery.populate).toHaveBeenCalledWith({
  //       path: "userId",
  //       select: "-password",
  //     });
  //     expect(mockQuery.lean).toHaveBeenCalled();
  //     expect(res.status).toHaveBeenCalledWith(500);
  //     expect(res.json).toHaveBeenCalledWith({
  //       message: "An error occurred while fetching the note",
  //       error: "Database error",
  //     });
  //   });
});
