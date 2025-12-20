import { describe, expect, it } from "vitest";
import { extractPageId } from "./utils.js";

describe("extractPageId", () => {
	describe("UUID形式の入力", () => {
		it("ハイフンなしの32文字のUUIDを受け付ける", () => {
			const input = "abc123def456abc123def456abc12345";
			expect(extractPageId(input)).toBe("abc123def456abc123def456abc12345");
		});

		it("ハイフン付きのUUID形式を受け付けてハイフンを除去する", () => {
			const input = "abc12345-def4-56ab-c123-def456abc123";
			expect(extractPageId(input)).toBe("abc12345def456abc123def456abc123");
		});

		it("大文字のUUIDを受け付ける", () => {
			const input = "ABC123DEF456ABC123DEF456ABC12345";
			expect(extractPageId(input)).toBe("ABC123DEF456ABC123DEF456ABC12345");
		});
	});

	describe("Notion URL形式の入力", () => {
		it("ワークスペース付きの標準的なURLからIDを抽出する", () => {
			const input =
				"https://www.notion.so/myworkspace/Page-Title-abc123def456abc123def456abc12345";
			expect(extractPageId(input)).toBe("abc123def456abc123def456abc12345");
		});

		it("ワークスペースなしのURLからIDを抽出する", () => {
			const input =
				"https://www.notion.so/Page-Title-abc123def456abc123def456abc12345";
			expect(extractPageId(input)).toBe("abc123def456abc123def456abc12345");
		});

		it("wwwなしのURLからIDを抽出する", () => {
			const input =
				"https://notion.so/Page-Title-abc123def456abc123def456abc12345";
			expect(extractPageId(input)).toBe("abc123def456abc123def456abc12345");
		});

		it("IDのみのシンプルなURLからIDを抽出する", () => {
			const input = "https://notion.so/abc123def456abc123def456abc12345";
			expect(extractPageId(input)).toBe("abc123def456abc123def456abc12345");
		});

		it("クエリパラメータ形式(p=)のURLからIDを抽出する", () => {
			const input =
				"https://www.notion.so/workspace?v=123&p=abc123def456abc123def456abc12345";
			expect(extractPageId(input)).toBe("abc123def456abc123def456abc12345");
		});
	});

	describe("無効な入力", () => {
		it("短すぎるIDに対してnullを返す", () => {
			expect(extractPageId("abc123")).toBeNull();
		});

		it("長すぎるIDに対してnullを返す", () => {
			expect(extractPageId("abc123def456abc123def456abc12345extra")).toBeNull();
		});

		it("無効な文字を含むIDに対してnullを返す", () => {
			expect(extractPageId("xyz123def456abc123def456abc1234g")).toBeNull();
		});

		it("Notion以外のURLに対してnullを返す", () => {
			expect(
				extractPageId("https://google.com/abc123def456abc123def456abc12345"),
			).toBeNull();
		});

		it("空文字に対してnullを返す", () => {
			expect(extractPageId("")).toBeNull();
		});
	});
});
