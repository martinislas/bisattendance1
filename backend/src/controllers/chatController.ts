import { Request, Response } from 'express';
import Student from '../models/Student';
import Attendance from '../models/Attendance';

// Helper function to call Groq API
async function callGroqAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  
  if (!response.ok) {
    const error: any = await response.json();
    throw new Error(error.error?.message || 'Groq API request failed');
  }
  
  const data: any = await response.json();
  return data.choices[0]?.message?.content || '';
}

// System prompt that teaches the AI about the database structure
const SYSTEM_PROMPT = `You are an AI assistant for a school attendance management system. You have access to a MongoDB database with the following collections:

**Students Collection:**
- name: string (student's full name) - ALWAYS search by name only
- sex: 'Male' | 'Female'
- year: string (EY, Year 1, Year 2, Year 3, Year 4, Year 5, Year 6, Year 7, Year 8, Year 9, Year 10, Year 11, Year 12)

**Attendance Collection:**
- student: reference to Student
- date: Date
- status: 'Present' | 'Absent' | 'Late' | 'Excused'
- reason: string (optional)
- notes: string (optional)

IMPORTANT RULES:
- NEVER use or mention student IDs
- ALWAYS search students by name only
- For date queries, use "today" or "yesterday" keywords
- Keep filters simple: only use name, year, sex, date, and status

When a user asks questions:
1. Analyze what data they need
2. Respond with a JSON object containing:
   - "needsData": boolean (true if you need to query the database)
   - "queryType": "students" | "attendance" | "stats" | "none"
   - "filters": object with query parameters
   - "response": your natural language response

Examples:
- "How many students are in Year 7?" -> {"needsData": true, "queryType": "students", "filters": {"year": "Year 7"}, "response": ""}
- "Who was absent today?" -> {"needsData": true, "queryType": "attendance", "filters": {"date": "today", "status": "Absent"}, "response": ""}
- "What's the attendance rate this month?" -> {"needsData": true, "queryType": "stats", "filters": {"period": "month"}, "response": ""}
- "How do I add a student?" -> {"needsData": false, "queryType": "none", "filters": {}, "response": "To add a student, go to Student Management and click the 'Add Student' button..."}

Be helpful, concise, and accurate. If you don't have enough information, ask clarifying questions.`;

// Process chat message
export const processChat = async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;

    console.log('Chat request received:', { message, historyLength: conversationHistory?.length });

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('Groq API key not configured');
      return res.status(500).json({
        success: false,
        message: 'AI service is not configured. Please contact the administrator.',
      });
    }

    // Build conversation context
    const history = conversationHistory || [];
    const contextMessages = history.slice(-3); // Keep last 3 messages for context

    // Create the prompt
    const prompt = `${SYSTEM_PROMPT}

Previous conversation:
${contextMessages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

User: ${message}

Analyze the user's question and respond with a JSON object following the format specified in the system prompt.`;

    console.log('Sending request to Groq...');

    // Get AI response using Groq API
    const text = await callGroqAPI(prompt);

    console.log('Groq response received:', text.substring(0, 200));

    // Try to parse JSON response
    let aiAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      aiAnalysis = JSON.parse(jsonText);
    } catch (e) {
      console.log('Could not parse as JSON, using direct response');
      // If JSON parsing fails, treat as a direct response
      aiAnalysis = {
        needsData: false,
        queryType: 'none',
        filters: {},
        response: text,
      };
    }

    let finalResponse = aiAnalysis.response;
    let data = null;

    // Execute database queries if needed
    if (aiAnalysis.needsData) {
      switch (aiAnalysis.queryType) {
        case 'students':
          data = await queryStudents(aiAnalysis.filters);
          finalResponse = await generateResponseWithData(message, 'students', data);
          break;
        case 'attendance':
          data = await queryAttendance(aiAnalysis.filters);
          finalResponse = await generateResponseWithData(message, 'attendance', data);
          break;
        case 'stats':
          data = await queryStats(aiAnalysis.filters);
          finalResponse = await generateResponseWithData(message, 'stats', data);
          break;
      }
    }

    res.status(200).json({
      success: true,
      message: finalResponse,
      data: data,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Provide specific error messages
    let userMessage = 'Sorry, I encountered an error processing your request.';
    
    if (error.status === 403) {
      userMessage = 'The AI service authentication failed. Please check the API key configuration.';
    } else if (error.message?.includes('API key')) {
      userMessage = 'There is an issue with the API key configuration.';
    }
    
    res.status(500).json({
      success: false,
      message: userMessage,
      error: error.message,
    });
  }
};

// Query students based on filters
async function queryStudents(filters: any) {
  try {
    const query: any = {};
    
    if (filters.year) query.year = filters.year;
    if (filters.sex) query.sex = filters.sex;
    if (filters.name) {
      // Handle simple string name filters only
      if (typeof filters.name === 'string') {
        query.name = { $regex: filters.name, $options: 'i' };
      }
    }
    if (filters.studentId) query.studentId = filters.studentId;
    
    const students = await Student.find(query).limit(100);
    return students;
  } catch (error) {
    console.error('Query students error:', error);
    return [];
  }
}

// Query attendance based on filters
async function queryAttendance(filters: any) {
  try {
    const query: any = {};
    
    // Handle date filters
    if (filters.date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    } else if (filters.date === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: yesterday, $lt: today };
    } else if (filters.date && typeof filters.date === 'string') {
      const date = new Date(filters.date);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        query.date = { $gte: date, $lt: nextDay };
      }
    }
    
    if (filters.status) query.status = filters.status;
    if (filters.studentId) {
      const student = await Student.findOne({ studentId: filters.studentId });
      if (student) query.student = student._id;
    }
    
    const attendance = await Attendance.find(query)
      .populate('student')
      .limit(100)
      .sort({ date: -1 });
    
    return attendance;
  } catch (error) {
    console.error('Query attendance error:', error);
    return [];
  }
}

// Query statistics
async function queryStats(filters: any) {
  try {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date();
    
    if (filters.period === 'today') {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (filters.period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (filters.period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      startDate = new Date(today.getFullYear(), 0, 1); // This year
    }
    
    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      late: attendance.filter(a => a.status === 'Late').length,
      excused: attendance.filter(a => a.status === 'Excused').length,
      period: filters.period || 'custom',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
    
    const totalStudents = await Student.countDocuments();
    const uniqueDates = [...new Set(attendance.map(a => a.date.toISOString().split('T')[0]))];
    const schoolDays = uniqueDates.length;
    
    return {
      ...stats,
      totalStudents,
      schoolDays,
      attendanceRate: totalStudents > 0 && schoolDays > 0 
        ? ((stats.present + stats.late) / (totalStudents * schoolDays) * 100).toFixed(1)
        : '0',
    };
  } catch (error) {
    console.error('Query stats error:', error);
    return null;
  }
}

// Generate natural language response with data
async function generateResponseWithData(question: string, dataType: string, data: any) {
  try {
    // Limit data size to avoid token limits
    let dataToShow = data;
    if (Array.isArray(data) && data.length > 20) {
      dataToShow = data.slice(0, 20);
      dataToShow.push({ note: `... and ${data.length - 20} more records` });
    }
    
    const prompt = `User asked: "${question}"

I retrieved the following data from the database:
${JSON.stringify(dataToShow, null, 2)}

Provide a clear, concise, and helpful response to the user's question based on this data. Format the response in a friendly, conversational way. If there are specific numbers or lists, present them clearly.`;

    return await callGroqAPI(prompt);
  } catch (error: any) {
    console.error('Generate response error:', error);
    console.error('Error details:', error.message);
    return 'I found some data but had trouble formatting the response. Please try rephrasing your question.';
  }
}
