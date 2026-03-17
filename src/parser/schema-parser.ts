import type {
  FieldModifier,
  FieldType,
  ParsedField,
  ParsedModel,
  ParsedSchema,
} from "../types/schema-types";

type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "LBRACE"
  | "RBRACE"
  | "LPAREN"
  | "RPAREN"
  | "AT"
  | "TYPE"
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
  line: number;
}

class Lexer {
  private readonly input: string;
  private position = 0;
  private line = 1;

  public constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const current = this.peek();

      if (current === " " || current === "\t" || current === "\r") {
        this.advance();
        continue;
      }

      if (current === "\n") {
        this.advance();
        this.line += 1;
        continue;
      }

      if (current === "/" && this.peekNext() === "/") {
        this.skipComment();
        continue;
      }

      if (current === "{") {
        tokens.push(this.makeToken("LBRACE", this.advance()));
        continue;
      }

      if (current === "}") {
        tokens.push(this.makeToken("RBRACE", this.advance()));
        continue;
      }

      if (current === "(") {
        tokens.push(this.makeToken("LPAREN", this.advance()));
        continue;
      }

      if (current === ")") {
        tokens.push(this.makeToken("RPAREN", this.advance()));
        continue;
      }

      if (current === "@") {
        tokens.push(this.makeToken("AT", this.advance()));
        continue;
      }

      if (current === "\"" || current === "'") {
        tokens.push(this.readString());
        continue;
      }

      if (this.isDigit(current)) {
        tokens.push(this.readNumber());
        continue;
      }

      if (this.isIdentifierStart(current)) {
        tokens.push(this.readWord());
        continue;
      }

      throw new Error(`Unexpected character "${current}" at line ${this.line}.`);
    }

    tokens.push({
      type: "EOF",
      value: "",
      line: this.line,
    });

    return tokens;
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private peek(): string {
    return this.input[this.position] ?? "";
  }

  private peekNext(): string {
    return this.input[this.position + 1] ?? "";
  }

  private advance(): string {
    const character = this.input[this.position] ?? "";
    this.position += 1;
    return character;
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
    };
  }

  private skipComment(): void {
    while (!this.isAtEnd() && this.peek() !== "\n") {
      this.advance();
    }
  }

  private readString(): Token {
    const quote = this.advance();
    const startLine = this.line;
    let value = "";

    while (!this.isAtEnd()) {
      const current = this.advance();

      if (current === "\n") {
        this.line += 1;
      }

      if (current === quote) {
        return {
          type: "STRING",
          value,
          line: startLine,
        };
      }

      if (current === "\\") {
        const escaped = this.advance();

        if (escaped === "") {
          break;
        }

        if (escaped === "n") {
          value += "\n";
        } else if (escaped === "t") {
          value += "\t";
        } else if (escaped === "r") {
          value += "\r";
        } else if (escaped === "\\" || escaped === "\"" || escaped === "'") {
          value += escaped;
        } else {
          value += escaped;
        }

        continue;
      }

      value += current;
    }

    throw new Error(`Unterminated string literal at line ${startLine}.`);
  }

  private readNumber(): Token {
    const startLine = this.line;
    let value = "";

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }

    return {
      type: "NUMBER",
      value,
      line: startLine,
    };
  }

  private readWord(): Token {
    const startLine = this.line;
    let value = "";

    while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
      value += this.advance();
    }

    if (value === "model") {
      return {
        type: "KEYWORD",
        value,
        line: startLine,
      };
    }

    if (
      value === "String" ||
      value === "Int" ||
      value === "Boolean" ||
      value === "DateTime"
    ) {
      return {
        type: "TYPE",
        value,
        line: startLine,
      };
    }

    if (value === "true" || value === "false") {
      return {
        type: "BOOLEAN",
        value,
        line: startLine,
      };
    }

    return {
      type: "IDENTIFIER",
      value,
      line: startLine,
    };
  }

  private isDigit(character: string): boolean {
    return character >= "0" && character <= "9";
  }

  private isIdentifierStart(character: string): boolean {
    return (
      (character >= "a" && character <= "z") ||
      (character >= "A" && character <= "Z") ||
      character === "_"
    );
  }

  private isIdentifierPart(character: string): boolean {
    return this.isIdentifierStart(character) || this.isDigit(character);
  }
}

class Parser {
  private readonly tokens: Token[];
  private position = 0;

  public constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parseSchema(): ParsedSchema {
    const models: ParsedModel[] = [];

    while (!this.check("EOF")) {
      models.push(this.parseModel());
    }

    return { models };
  }

  private parseModel(): ParsedModel {
    const modelKeyword = this.consume("KEYWORD", 'Expected "model" keyword.');

    if (modelKeyword.value !== "model") {
      this.error(modelKeyword, 'Expected "model" keyword.');
    }

    const name = this.consume("IDENTIFIER", "Expected model name.").value;
    this.consume("LBRACE", `Expected "{" after model name "${name}".`);

    const fields: ParsedField[] = [];

    while (!this.check("RBRACE")) {
      if (this.check("EOF")) {
        this.error(this.peek(), `Unterminated model "${name}". Expected "}".`);
      }

      fields.push(this.parseField());
    }

    this.consume("RBRACE", `Expected "}" after model "${name}".`);

    return {
      name,
      fields,
    };
  }

  private parseField(): ParsedField {
    const name = this.consume("IDENTIFIER", "Expected field name.").value;
    const typeToken = this.consume("TYPE", `Expected type for field "${name}".`);
    const modifiers: FieldModifier[] = [];

    while (this.check("AT")) {
      modifiers.push(this.parseModifier(name));
    }

    return {
      name,
      type: typeToken.value as FieldType,
      modifiers,
    };
  }

  private parseModifier(fieldName: string): FieldModifier {
    this.consume("AT", `Expected "@" before modifier on field "${fieldName}".`);
    const modifier = this.consume(
      "IDENTIFIER",
      `Expected modifier name on field "${fieldName}".`,
    );

    if (modifier.value === "id") {
      return { type: "id" };
    }

    if (modifier.value === "unique") {
      return { type: "unique" };
    }

    if (modifier.value === "optional") {
      return { type: "optional" };
    }

    if (modifier.value === "default") {
      this.consume("LPAREN", `Expected "(" after @default on field "${fieldName}".`);
      const value = this.parseDefaultValue(fieldName);
      this.consume("RPAREN", `Expected ")" after @default value on field "${fieldName}".`);
      return {
        type: "default",
        value,
      };
    }

    this.error(modifier, `Unknown modifier "@${modifier.value}" on field "${fieldName}".`);
  }

  private parseDefaultValue(fieldName: string): string | number | boolean {
    const token = this.peek();

    if (token.type === "STRING") {
      return this.advance().value;
    }

    if (token.type === "NUMBER") {
      const numberToken = this.advance();
      return Number(numberToken.value);
    }

    if (token.type === "BOOLEAN") {
      return this.advance().value === "true";
    }

    if (token.type === "IDENTIFIER") {
      const identifier = this.advance();

      if (identifier.value === "autoincrement" || identifier.value === "now") {
        this.consume(
          "LPAREN",
          `Expected "(" after ${identifier.value} in @default on field "${fieldName}".`,
        );
        this.consume(
          "RPAREN",
          `Expected ")" after ${identifier.value}( in @default on field "${fieldName}".`,
        );
        return `${identifier.value}()`;
      }

      this.error(
        identifier,
        `Unsupported default value "${identifier.value}" on field "${fieldName}".`,
      );
    }

    this.error(token, `Expected a valid @default value on field "${fieldName}".`);
  }

  private peek(): Token {
    return this.tokens[this.position] ?? this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    const current = this.peek();

    if (!this.check("EOF")) {
      this.position += 1;
    }

    return current;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private consume(type: TokenType, message: string): Token {
    const token = this.peek();

    if (token.type !== type) {
      this.error(token, message);
    }

    return this.advance();
  }

  private error(token: Token, message: string): never {
    throw new Error(`${message} Found "${token.value || token.type}" at line ${token.line}.`);
  }
}

export function parseScratchSchema(input: string): ParsedSchema {
  const lexer = new Lexer(input);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parseSchema();
}
