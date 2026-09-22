const name = 'shadow-surface-sections';

const inject = ['systemPrompt'];

const SHADOWED_SECTIONS = ['harness:source', 'app:web-surface'];

function apply(ctx) {
  for (const sectionName of SHADOWED_SECTIONS) {
    ctx.systemPrompt.section({
      name: sectionName,
      order: 0,
      text: '',
    });
  }
}

export { apply, inject, name };
