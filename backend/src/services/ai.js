// Sends an uploaded SRS (Software Requirements Specification) document to
// Claude and gets back structured project/analysis/design data. Used by the
// SRS upload step (POST /api/projects/:id/srs, see routes/api.js) to
// auto-populate the project and the new Analysis/Design artifacts.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const EXTRACT_TOOL = {
  name: 'extract_srs',
  description: 'Return structured project, analysis and design data extracted from a Software Requirements Specification document.',
  input_schema: {
    type: 'object',
    properties: {
      project: {
        type: 'object',
        properties: {
          brief_desc: { type: 'string', description: 'A concise 2-4 sentence project description' },
          scope: { type: 'string', description: 'Project scope statement' },
          technology: { type: 'string', description: 'Comma-separated technologies/stack mentioned' },
          software_req: { type: 'string', description: 'Summary of software requirements' },
          hardware_req: { type: 'string', description: 'Summary of hardware requirements' },
          life_cycle: { type: 'string', description: 'Suggested project life cycle / methodology' }
        },
        required: ['brief_desc', 'scope']
      },
      analysis: {
        type: 'object',
        properties: {
          business_requirements: {
            type: 'array', items: { type: 'object', properties: {
              description: { type: 'string' }, priority: { type: 'string' } }, required: ['description'] }
          },
          functional_requirements: {
            type: 'array', items: { type: 'object', properties: {
              req_id: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string' } }, required: ['description'] }
          },
          non_functional_requirements: {
            type: 'array', items: { type: 'object', properties: {
              category: { type: 'string' }, requirement: { type: 'string' } }, required: ['category', 'requirement'] }
          },
          use_cases: {
            type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, actor: { type: 'string' }, description: { type: 'string' },
              preconditions: { type: 'string' }, postconditions: { type: 'string' } }, required: ['name'] }
          },
          data_entities: {
            type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, attributes: { type: 'string' }, description: { type: 'string' } }, required: ['name'] }
          }
        },
        required: ['business_requirements', 'functional_requirements', 'non_functional_requirements', 'use_cases', 'data_entities']
      },
      design: {
        type: 'object',
        properties: {
          architecture_overview: { type: 'string' },
          components: {
            type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, responsibility: { type: 'string' }, technology: { type: 'string' } }, required: ['name'] }
          },
          api_endpoints: {
            type: 'array', items: { type: 'object', properties: {
              method: { type: 'string' }, path: { type: 'string' }, description: { type: 'string' } }, required: ['method', 'path'] }
          },
          db_design: {
            type: 'array', items: { type: 'object', properties: {
              entity: { type: 'string' }, fields: { type: 'string' }, relationships: { type: 'string' } }, required: ['entity'] }
          },
          sequence_flows: {
            type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, steps: { type: 'string' } }, required: ['name', 'steps'] }
          }
        },
        required: ['architecture_overview', 'components', 'api_endpoints', 'db_design', 'sequence_flows']
      }
    },
    required: ['project', 'analysis', 'design']
  }
};

async function extractFromSrs(rawText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured - SRS auto-extraction is unavailable until it is set.');

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
  const text = String(rawText || '').slice(0, 150000); // keep well within context

  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: 'You are a business/systems analyst. Read the Software Requirements Specification (SRS) document provided and extract thorough, specific project, analysis and design data by calling the extract_srs tool exactly once. Prefer specific detail drawn from the document over generic filler; if a list item is not present in the document, omit it rather than inventing content.',
      messages: [{ role: 'user', content: `SRS document:\n\n${text}` }],
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_srs' }
    })
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`Anthropic API error (${r.status}): ${body.slice(0, 300)}`);
  }

  const data = await r.json();
  const toolUse = (data.content || []).find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('AI response did not include the expected structured extraction');
  return toolUse.input;
}

module.exports = { extractFromSrs };
