import { z } from 'zod';

export const fieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'password', 'number', 'textarea', 'checkbox', 'select']).default('text'),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional()
});

const sectionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), title: z.string(), body: z.string() }),
  z.object({ type: z.literal('metrics'), title: z.string() }),
  z.object({ type: z.literal('forms'), title: z.string() }),
  z.object({ type: z.literal('tables'), title: z.string() }),
  z.object({ type: z.literal('roadmap'), title: z.string(), items: z.array(z.string()).default([]) })
]);

export const appConfigSchema = z.object({
  slug: z.string().default('dynamic-runtime'),
  title: z.string().default('Dynamic Runtime'),
  subtitle: z.string().default('A config-driven demo app'),
  theme: z.object({
    accent: z.string().default('#0ea5e9'),
    accentSecondary: z.string().default('#f97316'),
    surface: z.string().default('#f7f4ee')
  }).default({ accent: '#0ea5e9', accentSecondary: '#f97316', surface: '#f7f4ee' }),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), delta: z.string().optional() })).default([]),
  forms: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().default(''),
    submitLabel: z.string().default('Submit'),
    fields: z.array(fieldSchema).default([])
  })).default([]),
  tables: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    columns: z.array(z.object({ key: z.string(), label: z.string() })).default([]),
    rows: z.array(z.record(z.string(), z.any())).default([])
  })).default([]),
  sections: z.array(sectionSchema).default([]),
  auth: z.object({
    mode: z.string().default('email-password'),
    methods: z.array(z.enum(['password', 'otp'])).default(['password']),
    demoUser: z.object({ email: z.string().email(), password: z.string().min(4) }).optional()
  }).default({ mode: 'email-password', methods: ['password'] })
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type FormField = z.infer<typeof fieldSchema>;

export function normalizeConfig(input: unknown) {
  const parsed = appConfigSchema.safeParse(input);

  if (parsed.success) {
    return { config: parsed.data, issues: [] as string[] };
  }

  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`);
  return {
    config: appConfigSchema.parse({}),
    issues
  };
}