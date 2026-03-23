import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import {
  SUPPORTED_DOCUMENT_EXTENSIONS,
  SUPPORTED_DOCUMENT_MIME_TYPES,
} from "./document-constants.js";
import { AppError } from "../utils/app-error.js";

export interface ParsedDocument {
  text: string;
  extension: string;
}

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function normalizeText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function assertDocumentTypeAllowed(filename: string, mimeType: string) {
  const extension = getExtension(filename);
  if (
    !SUPPORTED_DOCUMENT_EXTENSIONS.has(extension) ||
    !SUPPORTED_DOCUMENT_MIME_TYPES.has(mimeType)
  ) {
    throw AppError.badRequest(
      `Unsupported document type. Allowed extensions: ${Array.from(
        SUPPORTED_DOCUMENT_EXTENSIONS
      ).join(", ")}`
    );
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text || "";
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function parseXlsx(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    sheets.push(`Sheet: ${sheetName}\n${csv}`);
  }
  return sheets.join("\n\n");
}

async function parseCsv(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

async function parseTextLike(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

export async function parseDocumentBuffer(
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<ParsedDocument> {
  const extension = getExtension(filename);
  assertDocumentTypeAllowed(filename, mimeType);

  let text = "";
  switch (extension) {
    case "pdf":
      text = await parsePdf(buffer);
      break;
    case "docx":
      text = await parseDocx(buffer);
      break;
    case "xlsx":
      text = await parseXlsx(buffer);
      break;
    case "csv":
      text = await parseCsv(buffer);
      break;
    case "txt":
    case "json":
    case "md":
      text = await parseTextLike(buffer);
      break;
    default:
      throw AppError.badRequest(`Unsupported extension: ${extension}`);
  }

  const normalized = normalizeText(text);
  if (!normalized) {
    throw AppError.badRequest("Document appears empty after extraction");
  }

  return { text: normalized, extension };
}
