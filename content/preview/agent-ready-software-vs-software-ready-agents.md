# Agent-ready Software vs. Software-ready Agents

- Type: Post
- Canonical HTML URL: `/2026/06/29/agent-ready-software-vs-software-ready-agents`
- Published: 2026-06-29T00:00:00.000Z
- Updated: 2026-06-29T07:02:27Z
- Author: Pablo Bermejo
- Labels: ai, product

---

We are using the phrase “agent-ready software” too loosely.

It is true that a lot of the work happening under that label is useful. We add `AGENTS.md` files. We write skills. We create markdown guides. We explain how the repo works, which commands to run, which files matter, which conventions to respect, and which footguns to avoid. All of that helps agents operate inside existing software.

But notice the direction of the adaptation.

Most of the time, the software has not become more agent-ready. The agent has become more software-ready. We are surrounding it with enough prose to behave like a competent user of the system we already had. That distinction matters because it changes where we put the work. For example, if every agent failure is looped back as a system prompt update, an extra guide, or another paragraph of context, then we are still treating the agent as the thing that must absorb the system. In other words, we keep making the agent more familiar with the software instead of making the software more explicit about what can and cannot happen.

To me, agent-ready software should be less about documentation and more about constraints, not necessarily written in markdown. Many of those constraints are already supposed to live in software: APIs, TypeScript types, schemas, tests, permissions, linters, generated clients, design tokens, or just libraries. In the agentic age, these are **ways of encoding intent into the environment where work happens,** not just implementation details anymore.

This is why I loved Polar's note on [LLM-safe design system](https://polar.sh/blog/orbit-llm-safe-design-system). The real move here is not explaining the design system better in English, but deciding which rules matter enough to become executable. We now know agents can understand our software. The question we need to ask ourselves is whether our software carries enough of its own intent that agents do not need a human to keep restating it every time. 

Let's explore these ideas.

## Context alone is not constraint

[Context is useful, though. It can guide behavior socially and procedurally](https://berme.io/2026/04/04/constraint-driven-development). **But context alone is a weak form of constraint when the system has no executable way to reject violations**.

A prompt instruction can tell an agent not to bypass the design system, but a TypeScript type can make certain bypasses harder to express inside the typed surface. A `README` can explain that business logic should not live in the component layer, but a lint rule can fail the build when it does. A `SKILL` can describe the correct API surface, but the API spec carries the correct shape by itself.

Those are different forms of knowledge that live at different levels of the system.

The strongest version of agent-ready software is not a repo with very concise markdown files attached to it. It is software whose boundaries are legible in code, executable at runtime, and hard to accidentally violate. APIs, types, tests, schemas, policies, permissions, linters, generated clients, state machines, design tokens, component contracts ... these are all ways of encoding intent into the system itself. 

## When rules want to move down

The Polar example is giving us a useful hint. When a rule is recurring, reviewable, and objectively verifiable, we should consider pushing it toward becoming a deterministic, executable constraint.

```berme
{
  "component": "constraint-descent",
  "version": 1,
  "eyebrow": "The constraint descent",
  "title": "A rule becomes more useful as the system learns to enforce it",
  "description": "Scroll through the same rule as it moves from human interpretation toward an executable boundary.",
  "steps": [
    {
      "label": "Human memory",
      "title": "The rule lives in conversation",
      "body": "A senior person remembers the intent and restates it when the work drifts. The rule is rich in judgment, but disappears when that person is absent."
    },
    {
      "label": "Context",
      "title": "The rule becomes Markdown",
      "body": "The intent becomes portable and agents can read it before acting. But understanding is still optional, and the system cannot reject a plausible misinterpretation."
    },
    {
      "label": "Convention",
      "title": "Review catches the violation",
      "body": "Examples, checklists, and human review make drift detectable. The boundary is clearer, but enforcement still arrives after the work and consumes attention."
    },
    {
      "label": "Contract",
      "title": "Types and schemas narrow the valid path",
      "body": "The rule enters the development surface. Invalid shapes become awkward or impossible to express, reducing how much intent every agent must reconstruct."
    },
    {
      "label": "Verification",
      "title": "Tests, lint, and CI reject drift",
      "body": "The rule becomes deterministic and reviewable. A violation produces a concrete failure instead of another conversation about what the agent should have inferred."
    },
    {
      "label": "Boundary",
      "title": "The platform protects the intent",
      "body": "APIs, permissions, state machines, and defaults constrain action at runtime. The software now carries the rule even when context is incomplete, stale, or missing."
    }
  ]
}
```

Of course, not every constraint can be encoded immediately. Some constraints are exploratory, strategic, aesthetic, or still poorly understood. Markdown is useful for those unstable edges because prose is cheap to change and good at carrying ambiguity. But when a rule keeps appearing in reviews, when every agent needs to be reminded of it, or when senior people keep restating it to preserve the shape of the system, that is a signal. The rule probably wants to move down a level from convention to API contract.

This is the real test for “agent-ready.” Not “can an agent understand our documentation?” but “[how much of our intent survives contact with automation](https://berme.io/2026/01/05/the-holiday-when-software-engineering-changed-forever) without requiring a human to restate it every time because the agent missed it or interpreted wrongly?”

## Beyond better instructions

This is also where technical leaders and product leaders need to be careful. The managerial instinct may be to ask teams for better agent instructions, better system prompts, better repo summaries, and better onboarding documents. Some of that is necessary, yes. But the more strategic reaction is to figure out which parts of the software architecture are only augmented with context for agents because we have not yet turned them into executable constraints.

That question cuts across architecture, product, design systems, security, compliance, and developer experience. It forces a product team to ask which rules are mere descriptions and which ones actually act as enforcement. In an agentic environment, that distinction matters because system boundaries unequivocally shape the decisions automation can make. It also reveals where the system relies too much on senior people holding the shape of the product in their heads.

The temptation is to solve the problem by building ever larger context packs around existing software. That will work for a while, especially because agents are getting better at absorbing messy context. But it also creates a strange dependency, since the more capable the agent becomes, the more invisible the weakness of the underlying system can remain. **The agent compensates for the software’s lack of explicit boundaries**.

This can push teams in exactly the wrong direction. Once agent output looks good enough often enough on loose requirements, it becomes tempting to create a rule a level up instead of one down. A constraint that should have become an API contract, a type, a library, or a validation rule becomes another paragraph in the context pack. Worse, teams may start removing existing product structure because the agent can now be “told” what to do. But plausible output is not the same thing as protected behavior.

That is dangerous because compensation looks like progress until it fails.

Take design systems, like in the Polar example. A company starts with loosely-documented brand guidelines such as colors, spacing, typography, button hierarchy, accessibility rules. Agents get close often enough, so the team’s reaction is to mov them to markdown to make them "agent-ready" as DOs and DONTs, examples, and other instructions in `AGENTS.md`. But that is the signal. If those rules keep coming back, they are ready to move down into the software as tokens, components, typed props, templates, lint rules, and defaults. Otherwise, the agent can keep producing screens that look right one by one while the product slowly fragments. 

The rule lived as a reminder in the conversation when it should have become a boundary in the software.

## Making the right thing easier

Agent-ready software should reduce the amount of conversation needed to do the right thing.

This does not mean enterprise software needs to be rebuilt from scratch in order to become agent-ready. That would be unrealistic and, in most cases, irresponsible. The work is more incremental than that. The question is not “can we redesign the whole system for agents?” but “where are agents most likely to act, and which boundaries in those areas are still enforced only by documentation, review, or memory?”

This is especially important for platforms. A PaaS does not make agent-readiness real by shipping one large breaking change and declaring the old world obsolete. It makes progress by versioning better contracts, generating safer clients, tightening extension points, encoding domain rules into templates, SDKs, and APIs, and giving teams migration paths from convention toward constraint. The platform’s job is to make the correct thing increasingly natural, and the dangerous thing increasingly difficult.

In that sense, agent-ready software is more like a direction of travel. Enterprise systems will carry legacy surfaces for a long time. The point is to stop adding more ambiguity at the edges where automation is going to operate, and to **move the highest-value rules down into the platform whenever they become stable enough to encode**. A human engineer can often absorb a fuzzy rule, infer the missing tradeoff, and ask the right follow-up question. An agent may do that sometimes, but we should not build an operating model around the hope that it always will. 

## Conclusion

So yes, keep writing the markdown. It is useful, and in many cases it is the only honest place to begin. Prose is where so-called judgment and taste can live while a team is still learning what it believes.

**But once a rule becomes stable, repeating it to every agent is a smell**.

At that point, the work is no longer just better prompting, better `AGENTS.md` or even better MCP. The work is moving intent into the system into APIs that narrow the valid paths, types that make bad shapes awkward, libraries that reduce the risk of hallucinations (and tokens), and CI that refuses to merge what the organization already knows is wrong.

That is the shift I think we need to pay attention to. Markdown should be the staging area for constraints, not their final resting place.

Software-ready agents help today’s agents survive inside systems built for humans with memory, judgment, and institutional context. Agent-ready software goes further by redesigning the space so agents can act with less ambiguity, less supervision, and fewer ways to be confidently wrong. The real test is whether the software still protects its boundaries when the agent’s context is incomplete, stale, missing, or misunderstood.

That is the work worth doing.
