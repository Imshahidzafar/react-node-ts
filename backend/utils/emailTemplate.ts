import fs from "fs";
import path from "path";

export class EmailTemplate {
  private static instance: EmailTemplate;
  private templates: Map<string, string>;

  private constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  public static getInstance(): EmailTemplate {
    if (!EmailTemplate.instance) {
      EmailTemplate.instance = new EmailTemplate();
    }
    return EmailTemplate.instance;
  }

  private loadTemplates(): void {
    const templatesDir = path.join(process.cwd(), "views", "emails");

    // Load verification template
    const verificationTemplate = fs.readFileSync(
      path.join(templatesDir, "verification.html"),
      "utf-8"
    );
    this.templates.set("verification", verificationTemplate);

    // Load password reset template
    const passwordResetTemplate = fs.readFileSync(
      path.join(templatesDir, "password-reset.html"),
      "utf-8"
    );
    this.templates.set("password-reset", passwordResetTemplate);

    // Load verification failed template
    const verificationFailedTemplate = fs.readFileSync(
      path.join(templatesDir, "verification-failed.html"),
      "utf-8"
    );
    this.templates.set("verification-failed", verificationFailedTemplate);
  }

  public render(templateName: string, data: Record<string, string>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    let renderedTemplate = template;
    for (const [key, value] of Object.entries(data)) {
      renderedTemplate = renderedTemplate.replace(
        new RegExp(`{{${key}}}`, "g"),
        value
      );
    }

    return renderedTemplate;
  }
}

export default EmailTemplate.getInstance();
