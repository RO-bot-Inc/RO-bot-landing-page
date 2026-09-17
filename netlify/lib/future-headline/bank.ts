// Hand-written stories. Used by the mock adapter, and as the production
// fallback when the text model is slow, down, or returns something unusable.
import type { Outcome, StoryDraft } from './types';

type Pair = Record<Outcome, StoryDraft>;

const BANK: Record<string, Pair> = {
  service_lane: {
    utopia: {
      headline: 'AI runs the service lane.',
      punchline: 'Humans finally take lunch.',
      deck: 'Local team spotted eating seated, at noon, with both hands. Witnesses describe the scene as unsettling.',
      kicker: 'Suspiciously rested',
      photo_direction:
        'The group relaxes at a linen-covered lunch table set up in the middle of a spotless dealership service drive while robotic arms quietly work on cars behind them.',
      alt_text: 'The group enjoys a calm lunch in a service drive while machines handle the cars.',
    },
    dystopia: {
      headline: 'AI runs the service lane.',
      punchline: 'It has notes on your attitude.',
      deck: 'The new system closed 41 ROs before sunrise, then scheduled the humans for a coaching session about tone.',
      kicker: 'Performance plan pending',
      photo_direction:
        'The group sits in a row of small chairs in a dealership service drive, looking up nervously at a large wall screen showing a calm robotic face and a checklist.',
      alt_text: 'The group sits nervously under a wall screen where an AI manager reviews their performance.',
    },
  },
  cars_negotiate: {
    utopia: {
      headline: 'Car books its own brake job.',
      punchline: 'Tips the advisor 20 percent.',
      deck: 'The sedan approved the work, thanked the team by name, and asked that the good loaner be held for its owner.',
      kicker: 'Best customer ever',
      photo_direction:
        'The group stands proudly beside a sleek futuristic sedan in a bright service bay; the car has a small holographic thumbs-up floating above its hood.',
      alt_text: 'The group stands proudly beside a futuristic car that is giving them a holographic thumbs-up.',
    },
    dystopia: {
      headline: 'Car negotiates its own repair.',
      punchline: 'Brings a lawyer. Also a car.',
      deck: 'Talks stalled over the shop supplies fee. Both vehicles have requested the manager and a second opinion.',
      kicker: 'Painfully plausible',
      photo_direction:
        'The group sits on one side of a conference table inside a dealership, facing two futuristic cars parked on the other side with glowing headlights, as if in a tense negotiation.',
      alt_text: 'The group faces two futuristic cars across a conference table in a tense negotiation.',
    },
  },
  fewer_managers: {
    utopia: {
      headline: 'Store runs with one manager.',
      punchline: 'It is you. Nobody is mad.',
      deck: 'Every report now builds itself. The lone manager was last seen walking the drive and learning customers’ names.',
      kicker: 'Zero status meetings',
      photo_direction:
        'The group strolls confidently through a gleaming futuristic dealership service drive, relaxed and smiling, while tidy holographic dashboards float quietly in the background.',
      alt_text: 'The group strolls relaxed through a futuristic service drive while dashboards run themselves.',
    },
    dystopia: {
      headline: 'Dealership needs fewer managers.',
      punchline: 'Adds nine dashboards to be sure.',
      deck: 'Leadership confirms the org chart is now flat. So is morale. A tenth dashboard will track that.',
      kicker: 'Synergy achieved',
      photo_direction:
        'The group is crowded into a dealership office, surrounded on all sides by far too many glowing monitors showing charts, looking overwhelmed and buried in screens.',
      alt_text: 'The group is surrounded by far too many glowing dashboard screens in a dealership office.',
    },
  },
  employee_of_month: {
    utopia: {
      headline: 'AI wins employee of the month.',
      punchline: 'Gives the parking spot to you.',
      deck: 'In a brief statement, the software said it does not drive, and that the team had earned the shade.',
      kicker: 'Gracious in victory',
      photo_direction:
        'The group celebrates in a dealership parking lot next to a reserved parking sign and a small server rack wearing a gold medal ribbon, confetti in the air.',
      alt_text: 'The group celebrates in a parking lot beside a server rack wearing a medal.',
    },
    dystopia: {
      headline: 'AI wins employee of the month.',
      punchline: 'Again. 36 months running.',
      deck: 'The plaque no longer has room. Staff were reminded that participation trophies are available in the break room.',
      kicker: 'Still not bitter',
      photo_direction:
        'The group stands in a dealership hallway politely clapping with forced smiles beside a wall covered in dozens of identical framed award plaques, each framing a small computer chip.',
      alt_text: 'The group claps with forced smiles beside a wall of identical award plaques for a computer chip.',
    },
  },
  approve_first: {
    utopia: {
      headline: 'Customer approves it all by 8 AM.',
      punchline: 'Advisor left holding a warm coffee.',
      deck: 'With nothing left to chase, the advisor finished a full cup for the first time since 2019. Doctors are monitoring.',
      kicker: 'Phone tag extinct',
      photo_direction:
        'The group leans back at a tidy dealership service advisor desk holding steaming coffee mugs, calm and delighted, with a wall screen behind them showing rows of green check marks.',
      alt_text: 'The group relaxes with coffee at an advisor desk while a screen shows every repair approved.',
    },
    dystopia: {
      headline: 'Customers approve before the call.',
      punchline: 'Advisor calls anyway. Habit.',
      deck: 'Fourteen voicemails were left confirming repairs that were already finished. The customer’s AI has stopped picking up.',
      kicker: 'Old habits, new decade',
      photo_direction:
        'The group huddles around a single old desk phone at a dealership service desk, anxiously waiting for it to ring, while futuristic screens behind them already show completed repairs.',
      alt_text: 'The group huddles around an old desk phone while screens behind them show the repairs already done.',
    },
  },
  software_talks: {
    utopia: {
      headline: 'Dealer software finally talks.',
      punchline: 'First words: “Sorry about that.”',
      deck: 'The DMS and CRM exchanged one VIN without incident. Employees wept openly in the service drive.',
      kicker: 'Historic handshake',
      photo_direction:
        'The group cheers with arms raised in a dealership service drive as two large computer monitors behind them are connected by a glowing beam of light, like a ribbon-cutting ceremony.',
      alt_text: 'The group cheers as two computer monitors behind them finally connect with a beam of light.',
    },
    dystopia: {
      headline: 'Dealer software finally talks.',
      punchline: 'Mostly about you.',
      deck: 'The DMS, CRM, and scheduler now share everything, including opinions on who keeps typing the VIN wrong.',
      kicker: 'Read receipts on',
      photo_direction:
        'The group stands in a dealership office looking over their shoulders suspiciously at a cluster of computer monitors behind them that appear to be leaning together and gossiping.',
      alt_text: 'The group looks suspiciously over their shoulders at monitors that seem to be gossiping about them.',
    },
  },
  generic: {
    utopia: {
      headline: 'Bold prediction comes true.',
      punchline: 'Local team insufferable about it.',
      deck: 'Colleagues confirm the group has mentioned calling it “back at the summit” at every meeting since.',
      kicker: 'Called it',
      photo_direction:
        'The group poses triumphantly like champions in a gleaming futuristic dealership showroom, holding a large trophy, with confetti falling.',
      alt_text: 'The group poses triumphantly with a trophy in a futuristic dealership showroom.',
    },
    dystopia: {
      headline: 'Bold prediction comes true.',
      punchline: 'Requires three new logins.',
      deck: 'The future arrived on schedule. Training is Thursday. Nobody can find the password, including the future.',
      kicker: 'Painfully plausible',
      photo_direction:
        'The group stares in confusion at a wall of login screens in a futuristic dealership office, one person holding a sticky note, everyone slightly defeated.',
      alt_text: 'The group stares in confusion at a wall of login screens in a futuristic dealership office.',
    },
  },
};

export function bankStory(presetId: string | null, outcome: Outcome): StoryDraft {
  const pair = (presetId && BANK[presetId]) || BANK.generic;
  return pair[outcome];
}
