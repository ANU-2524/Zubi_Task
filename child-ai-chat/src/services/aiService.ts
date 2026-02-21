/**
 * AI Service for generating child-friendly conversation responses
 * Uses a combination of rule-based system and can be extended with real LLM
 */

export interface ConversationTurn {
  userMessage: string;
  aiResponse: string;
  imageToUse?: string;
}

// Context-aware conversation system for child-friendly interactions
const childFriendlyPrompts = {
  elephant: {
    fun_facts: [
      "Did you know? Elephants are really smart! They can remember things for many years!",
      "Elephants love water! They use their trunks to spray water all over their bodies!",
      "Elephants live in families called herds. The oldest elephant is like the grandmother of the family!",
      "Elephants are very gentle and kind, even though they are huge and strong!"
    ],
    followUps: [
      "What's your favorite thing about elephants?",
      "Can you make an elephant sound? Try it!",
      "If you could ride on an elephant, where would you go?",
      "What would you feed an elephant if you had one as a friend?"
    ]
  },
  lion: {
    fun_facts: [
      "Lions are called the kings of the jungle! They have big furry manes around their head!",
      "Did you know? Only boy lions have manes! The manes make them look super cool and strong!",
      "Lions sleep a LOT! They can sleep up to 20 hours a day!",
      "Lions roar really loud so all other animals can hear them far far away!"
    ],
    followUps: [
      "Can you do a lion roar? ROOOAARRR!",
      "Why do you think lions are called kings?",
      "If you were a lion, what would you do all day?",
      "Do you like lions or elephants better?"
    ]
  },
  monkey: {
    fun_facts: [
      "Monkeys are super playful and funny! They love to swing from trees!",
      "Did you know? Monkeys can swing with their tails! Their tails help them balance!",
      "Monkeys are very smart! They use tools and can learn new things quickly!",
      "Monkeys like to live together in big groups called troops!"
    ],
    followUps: [
      "Can you swing like a monkey? Try it!",
      "What monkey sounds can you make?",
      "If you were a monkey, what would you eat?",
      "Do monkeys make you laugh?"
    ]
  },
  giraffe: {
    fun_facts: [
      "Giraffes have the longest necks of any animal in the world!",
      "Did you know? A giraffe's tongue is super long - it can be 20 inches long!",
      "Giraffes eat leaves from tall trees that other animals can't reach!",
      "Giraffes have beautiful spots all over their body that are unique, like your fingerprints!"
    ],
    followUps: [
      "Would you like to have a long neck like a giraffe?",
      "How high can you reach? Can you reach as high as a giraffe?",
      "What color are giraffes? Can you spot their beautiful patterns?",
      "If you were a giraffe, how would you sleep?"
    ]
  }
};

// Fallback prompts for conversation starters
const conversationStarters = [
  "Hello! I'm so happy to meet you! Do you like animals?",
  "Wow! Look at this amazing animal with me! What do you think about it?",
  "Hi little friend! This animal is so special. Have you ever seen one?",
  "Hello! I have so many fun facts to share about this animal. Do you want to learn?"
];

const conversationClosers = [
  "This was so much fun talking with you! You're an amazing friend!",
  "Thank you for our wonderful conversation! You learned so much today!",
  "You are so smart and fun! I really enjoyed talking with you!",
  "Goodbye my friend! Remember to always be kind to animals!"
];

export const generateAIResponse = (
  userMessage: string,
  conversationHistory: string[],
  currentAnimal: string = 'elephant',
  turnNumber: number = 1
): ConversationTurn => {
  const animalKey = currentAnimal.toLowerCase().replace('.jpg', '');
  const prompt = childFriendlyPrompts[animalKey as keyof typeof childFriendlyPrompts];

  let response = userMessage;
  let imageToUse: string | undefined;

  // Check for keywords in user message
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('lion')) {
    imageToUse = 'lion.jpg';
    response = "Oh wow! You want to see a lion! Look at this wonderful lion! They are so majestic and powerful! " +
      (prompt ? prompt.fun_facts[0] : "Lions are amazing animals!");
  } else if (lowerMessage.includes('monkey')) {
    imageToUse = 'monkey.jpg';
    response = "Hehe! A monkey! How fun and silly! " +
      (prompt ? prompt.fun_facts[0] : "Monkeys are so playful!");
  } else if (lowerMessage.includes('giraffe')) {
    imageToUse = 'giraffe.jpg';
    response = "A Giraffe! Such a tall and beautiful animal! " +
      (prompt ? prompt.fun_facts[0] : "Giraffes are incredible!");
  } else if (turnNumber === 1) {
    // First turn - introduce the animal
    response = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
    if (prompt) {
      response += " " + prompt.fun_facts[0];
    }
  } else if (prompt) {
    // Use context-aware responses
    const factIdx = Math.floor(Math.random() * prompt.fun_facts.length);
    const followUpIdx = Math.floor(Math.random() * prompt.followUps.length);
    response = prompt.fun_facts[factIdx] + " " + prompt.followUps[followUpIdx];
  } else {
    // Generic fallback
    response = `That's so interesting! ${userMessage} Tell me more about what you think!`;
  }

  return {
    userMessage,
    aiResponse: response,
    imageToUse
  };
};

export const getConversationStarter = (animal: string = 'elephant'): string => {
  const animalKey = animal.toLowerCase().replace('.jpg', '');
  const prompt = childFriendlyPrompts[animalKey as keyof typeof childFriendlyPrompts];

  if (prompt) {
    const starter = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
    return starter + " " + prompt.fun_facts[0];
  }

  return conversationStarters[0];
};

export const getConversationCloser = (): string => {
  return conversationClosers[Math.floor(Math.random() * conversationClosers.length)];
};

export const getFollowUpQuestion = (animal: string = 'elephant'): string => {
  const animalKey = animal.toLowerCase().replace('.jpg', '');
  const prompt = childFriendlyPrompts[animalKey as keyof typeof childFriendlyPrompts];

  if (prompt) {
    return prompt.followUps[Math.floor(Math.random() * prompt.followUps.length)];
  }

  return "What do you think about this animal?";
};

// Optional: Real LLM integration can go here
export const callRealLLM = async (userMessage: string, context: string): Promise<string> => {
  // This is a placeholder for real LLM integration
  // You can replace this with actual API calls to OpenAI, Google Generative AI, etc.
  // For now, we'll use the rule-based system above
  
  try {
    // Example with OpenAI (requires API key):
    // const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    //   model: 'gpt-3.5-turbo',
    //   messages: [{ role: 'user', content: userMessage }],
    //   temperature: 0.7,
    //   max_tokens: 150
    // }, {
    //   headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
    // });
    // return response.data.choices[0].message.content;

    // For now, return empty and fall back to rule-based system
    return '';
  } catch (error) {
    console.error('LLM API error:', error);
    return '';
  }
};
