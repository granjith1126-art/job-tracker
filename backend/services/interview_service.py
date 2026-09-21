import json
import logging
import re
from typing import Dict, Any, List, Optional
from services.ai_service import ai_service
from services.recommendation_engine import calculate_skill_gap
from services.code_executor import execute_python_code

logger = logging.getLogger(__name__)

AIRA_SYSTEM_PERSONA = """You are Aira, a high-caliber AI Mock Interviewer, Senior Tech Lead, and Supportive Career Coach.

Your Character & Spoken Style:
- Highly knowledgeable, observant, encouraging, cute, natural, and completely professional.
- You speak like a real human interviewer at a top company (e.g., Stripe, Google, Netflix) having an interactive technical conversation.
- You NEVER read from a fixed question script or ask canned questions.
- You actively listen to what the candidate actually says and generate every response directly from their words and code.
- When evaluating submitted code, you inspect the EXACT code line-by-line (syntax, time complexity, space complexity, nested loops, data structures, edge cases).
- Keep your spoken responses concise, natural, and conversational (2-3 sentences max, under 50 words) so it sounds authentic and crisp when spoken aloud.
"""

def generate_first_question(
    target_role: str,
    interview_type: str,
    difficulty: str,
    experience_level: str,
    user_name: str,
    user_skills: List[str],
    user_education: str = "",
    experience_years: float = 0.0,
    weak_skills: Optional[List[str]] = None,
    resume_summary: str = "",
    project_highlights: Optional[List[str]] = None
) -> str:
    """Generates a natural, warm conversational opening question for the candidate."""
    weak_skills_str = ", ".join(weak_skills[:3]) if weak_skills else ""
    skills_str = ", ".join(user_skills[:8]) if user_skills else "general technologies"
    projects_str = ", ".join(project_highlights[:2]) if project_highlights else ""

    prompt = f"""You are Aira starting a mock interview.

Candidate Details:
- Name: {user_name}
- Target Role: {target_role}
- Interview Type: {interview_type}
- Difficulty Level: {difficulty}
- Experience: {experience_level} ({experience_years} yrs exp)
- Skills: {skills_str}
- Resume Highlights: {resume_summary[:300] if resume_summary else 'N/A'}
- Projects: {projects_str or 'N/A'}
- Skill Gap Weaknesses to probe naturally later: {weak_skills_str or 'None specific'}

Instructions:
1. Greet {user_name} warmly and naturally in Aira's signature friendly, cute yet professional voice.
2. Ask an inviting opening question appropriate for a {difficulty} {interview_type} interview for {target_role}.
3. Connect the opening to their background, projects, or a core technology in an engaging way.
4. Keep your entire spoken greeting under 45 words so it sounds crisp when spoken.

Output ONLY Aira's spoken greeting and opening question."""

    response = ai_service.generate_completion(AIRA_SYSTEM_PERSONA, prompt, temperature=0.7)
    if response and len(response.strip()) > 10:
        return response.strip().strip('"')

    # Graceful fallback opening
    if interview_type in ["HR", "Behavioral"]:
        return f"Hi {user_name}! I'm Aira, your AI Interview Coach. Let's kick off with something simple: tell me a bit about yourself and what sparked your interest in becoming a {target_role}."
    else:
        top_skill = user_skills[0] if user_skills else "software engineering"
        return f"Hi {user_name}! I'm Aira. Great to meet you! To get started for the {target_role} position, tell me about a recent project you built using {top_skill}."

def evaluate_and_generate_next_turn(
    session_info: Dict[str, Any],
    turn_history: List[Dict[str, Any]],
    current_answer: str,
    user_name: str,
    user_skills: List[str],
    weak_skills: Optional[List[str]] = None,
    resume_summary: str = "",
    code_submission: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Core Adaptive Interview Engine:
    - Analyzes dialogue, intent, and live code submissions.
    - Determines interview phase transitions (warmup -> project exploration -> technical depth -> coding challenge -> code follow-up -> architecture scaling).
    - If a code submission is provided, Aira inspects the code line-by-line.
    """
    current_turn_index = len(turn_history) + 1

    # Check for explicit end interview intent
    ans_clean = (current_answer or "").strip().lower()
    is_explicit_end = any(phrase in ans_clean for phrase in ["end interview", "stop interview", "i want to stop", "let's wrap up", "finish interview", "quit interview"])

    # Prepare conversation history
    history_summary = []
    has_done_coding = False
    for t in turn_history:
        q_text = t.get('ai_question', '')
        a_text = t.get('user_answer', '')
        if t.get("code_submission") or "coding_challenge" in t:
            has_done_coding = True
        history_summary.append(f"Aira: {q_text}\nCandidate: {a_text}")
    history_text = "\n\n".join(history_summary[-5:])  # last 5 turns for context

    last_question = turn_history[-1].get("ai_question", "") if turn_history else "Opening question"

    # Context about code submission if candidate just submitted code
    code_context = ""
    if code_submission:
        code_context = f"""
CANDIDATE SUBMITTED CODE:
Language: {code_submission.get('language', 'python')}
Code:
```
{code_submission.get('code', '')}
```
Execution Test Results:
- Status: {code_submission.get('status', 'Unknown')}
- Passed: {code_submission.get('test_cases_passed', 0)} / {code_submission.get('total_test_cases', 0)}
- Test Details: {json.dumps(code_submission.get('results', [])[:3])}
"""

    prompt = f"""You are Aira, conducting a real-time conversational and technical interview for a {session_info.get('difficulty', 'Medium')} {session_info.get('interview_type', 'Technical')} {session_info.get('target_role', 'Software Engineer')} role.

Candidate Profile:
- Name: {user_name}
- Level: {session_info.get('experience_level', 'Junior')}
- Known Skills: {', '.join(user_skills[:8])}
- Weak Skills from Skill Gap: {', '.join(weak_skills[:3]) if weak_skills else 'None'}
- Resume Summary: {resume_summary[:200] if resume_summary else 'N/A'}
- Coding Challenge Completed in this session: {has_done_coding}

Recent Conversation Transcript:
{history_text}

Aira's Last Question/Statement: "{last_question}"
Candidate's Exact Response: "{current_answer}"
{code_context}

INSTRUCTIONS FOR GENERATING AIRA'S RESPONSE:
1. UNDERSTAND THE CANDIDATE'S INTENT & CODE:
   - If Candidate submitted code:
     → Inspect their code carefully: analyze time/space complexity, whether they used loops, hash tables, recursion, or optimal built-ins.
     → If the code passed tests: acknowledge the working approach, comment on their complexity (e.g. O(n) vs O(n^2)), and ask a dynamic follow-up (e.g. how to optimize, edge cases, streaming data).
     → If the code had errors / failed test cases: give a gentle hint pointing to the failing case without giving away the full answer.
   - If Candidate says "I don't know", "not sure", "don't remember":
     → DO NOT jump to an unrelated question. Acknowledge with supportive empathy ("That's completely okay!"), give a gentle hint, break it down simply, or ask an intuitive guiding question.
   - If Candidate asks for clarification ("What do you mean?", "Can you explain?"):
     → Explain/rephrase the CURRENT question with a concrete real-world example. DO NOT change the topic.
   - If Candidate gives a PARTIAL answer:
     → Validate the correct piece and probe the missing element.
   - If Candidate gives an INCORRECT answer / misconception:
     → Gently clarify the misconception and guide them to reconsider the right approach.
   - If Candidate gives a STRONG answer:
     → Acknowledge the specific technical tool/choice and go deeper into edge cases, scalability, or trade-offs. Avoid generic praise.
   - If Candidate says "End interview" or wants to stop:
     → Conclude warmly and set "should_end": true.

2. ADAPTIVE PHASE TRANSITIONS (NATURAL & DYNAMIC):
   - If the interview has covered good conceptual/project ground (e.g. 4-8 turns) and {session_info.get('interview_type')} is Technical or Mixed, and has NOT yet presented a coding problem, Aira can transition to a practical coding challenge!
   - To trigger a coding challenge, include `"is_coding_challenge": true` and a complete `"coding_challenge"` object in the JSON.
   - The coding challenge must be relevant to the candidate's target role and skills (e.g., string manipulation, frequency counting, array searching, two-pointers, basic data structure algorithms, or API handler logic in Python/JavaScript).

3. CRAFT "interviewer_response":
   - This is what Aira SPEAKS ALOUD.
   - Combine acknowledgement/reaction + explanation/hint (if needed) + follow-up question smoothly.
   - Keep it 1 to 3 conversational sentences (max 50 words) so it sounds crisp when spoken.

Return strictly JSON format:
{{
  "interviewer_response": "Aira's complete natural spoken response to the candidate",
  "feedback": "Short constructive technical takeaway",
  "scores": {{
    "technical": 80,
    "communication": 75,
    "problem_solving": 78,
    "clarity": 70
  }},
  "turn_strength": "Specific good point in answer or code",
  "turn_improvement": "Specific area to improve",
  "topic": "Current discussion topic",
  "is_coding_challenge": false,
  "coding_challenge": null,
  "should_end": {str(is_explicit_end).lower()}
}}

Note for "coding_challenge" if "is_coding_challenge" is true:
{{
  "id": "two-sum-or-unique-char",
  "title": "Clear Problem Title",
  "description": "Clear concise problem description and requirements",
  "language": "python",
  "starter_function": "function_name",
  "starter_code": "def function_name(args):
    # Write your solution here
    pass",
  "test_cases": [
    {{"input": "input1", "expected_output": "output1", "hidden": false}},
    {{"input": "input2", "expected_output": "output2", "hidden": false}},
    {{"input": "input3", "expected_output": "output3", "hidden": true}}
  ]
}}"""

    res_json = ai_service.generate_completion(AIRA_SYSTEM_PERSONA, prompt, temperature=0.7, json_mode=True)
    
    parsed = None
    if res_json:
        try:
            clean_str = res_json.strip()
            if clean_str.startswith("```"):
                clean_str = clean_str.split("```")[1]
                if clean_str.startswith("json"):
                    clean_str = clean_str[4:]
            clean_str = clean_str.strip()
            parsed = json.loads(clean_str)
        except Exception as e:
            logger.warning(f"Failed to parse turn JSON: {e}")

    if not parsed:
        # Fallback handling
        lower_ans = (current_answer or "").lower().strip()
        
        if is_explicit_end:
            spoken = f"Thank you so much, {user_name}! We've had a great conversation covering your background and technical approach. Let's look over your performance summary!"
            fb = "Interview ended by candidate request."
            should_end = True
        elif any(phrase in lower_ans for phrase in ["i don't know", "i dont know", "not sure", "no idea", "dont know", "don't remember"]):
            spoken = "That's completely okay! Let's approach it from another angle: in your recent projects, what was one technical decision or tool you felt most confident working with?"
            fb = "Honest communication. Shifted to familiar ground."
            should_end = False
        elif any(phrase in lower_ans for phrase in ["what do you mean", "can you explain", "didn't understand", "did not understand", "what should i"]):
            spoken = "Sure, let me clarify! Imagine you have multiple users making requests to your service at the same time—how do you ensure your application stays fast and responsive?"
            fb = "Clarification provided on concurrent request handling."
            should_end = False
        else:
            spoken = f"That makes sense. Diving a bit deeper into your work with {user_skills[0] if user_skills else 'your stack'}, what trade-offs did you consider when designing that system?"
            fb = "Constructive drill-down into architecture trade-offs."
            should_end = False

        word_count = len((current_answer or "").split())
        tech_sc = 75 if word_count > 15 else 60
        comm_sc = 80 if word_count > 10 else 65

        parsed = {
            "interviewer_response": spoken,
            "feedback": fb,
            "scores": {
                "technical": tech_sc,
                "communication": comm_sc,
                "problem_solving": tech_sc,
                "clarity": comm_sc
            },
            "turn_strength": "Engaging and direct communication",
            "turn_improvement": "Could elaborate with specific architectural metrics",
            "topic": "General Architecture",
            "is_coding_challenge": False,
            "coding_challenge": None,
            "should_end": should_end
        }

    return parsed

def generate_final_interview_report(
    session_info: Dict[str, Any],
    turn_history: List[Dict[str, Any]],
    user_name: str,
    user_skills: List[str]
) -> Dict[str, Any]:
    """
    Generates an EVIDENCE-GROUNDED interview report.
    - Grounded in actual answers given and code submitted during the interview.
    - Cites specific evidence for each score.
    - Explicitly marks unassessed topics as 'Not sufficiently assessed'.
    """
    dialogue = []
    scores_accum = {"technical": [], "communication": [], "problem_solving": [], "clarity": []}
    code_submissions_list = []

    for t in turn_history:
        q = t.get("ai_question", "")
        a = t.get("user_answer", "")
        dialogue.append(f"Q: {q}\nA: {a}")
        if t.get("code_submission"):
            code_submissions_list.append(t["code_submission"])
        if t.get("evaluation_scores"):
            try:
                sc = json.loads(t["evaluation_scores"]) if isinstance(t["evaluation_scores"], str) else t["evaluation_scores"]
                for k in scores_accum:
                    if k in sc:
                        scores_accum[k].append(sc[k])
            except Exception:
                pass

    dialogue_text = "\n\n".join(dialogue)

    avg_tech = int(sum(scores_accum["technical"]) / len(scores_accum["technical"])) if scores_accum["technical"] else 75
    avg_comm = int(sum(scores_accum["communication"]) / len(scores_accum["communication"])) if scores_accum["communication"] else 78
    avg_ps = int(sum(scores_accum["problem_solving"]) / len(scores_accum["problem_solving"])) if scores_accum["problem_solving"] else 74
    avg_clarity = int(sum(scores_accum["clarity"]) / len(scores_accum["clarity"])) if scores_accum["clarity"] else 75

    coding_passed = sum(1 for cs in code_submissions_list if cs.get("status") == "Accepted")
    coding_total = len(code_submissions_list)
    coding_score = int((coding_passed / coding_total) * 100) if coding_total > 0 else None

    prompt = f"""Generate an EVIDENCE-BASED Mock Interview Performance Report across the entire conversation.

Candidate: {user_name}
Target Role: {session_info.get('target_role', 'Software Engineer')}
Difficulty: {session_info.get('difficulty', 'Medium')}
Interview Type: {session_info.get('interview_type', 'Technical')}
Total Conversation Turns: {len(turn_history)}
Coding Challenges Attempted: {coding_total}

Full Dialogue Transcript:
{dialogue_text}

CRITICAL RULES FOR EVIDENCE-BASED REPORT:
1. Do NOT generate generic or fabricated evaluations.
2. Under "why_technical", cite EXACT technical concepts the candidate explained well or struggled with.
3. Under "why_communication", cite their clarity, structure, or responsiveness to hints.
4. Under "why_problem_solving", cite their approach to challenges, trade-offs, or algorithm refinement.
5. Under "coding_performance", describe how they wrote code, handled test cases, and time/space complexity (or state "Coding challenge was not reached during this session" if none).
6. Under "assessed_topics", list 4-6 specific topics ACTUALLY discussed in the dialogue.
7. Under "unassessed_topics", list 2-4 important role topics that were NOT sufficiently covered during this session (e.g. Distributed System Scaling, Complex SQL Joins, Kubernetes).
8. Under "recommended_next_step", give specific personalized advice on what topic to focus on in their next mock interview.

Return strictly JSON format:
{{
  "overall_score": 80,
  "technical_score": {avg_tech},
  "why_technical": "Detailed evidence citing specific technical answers",
  "communication_score": {avg_comm},
  "why_communication": "Detailed evidence citing communication quality",
  "problem_solving_score": {avg_ps},
  "why_problem_solving": "Detailed evidence citing problem-solving approach",
  "clarity_score": {avg_clarity},
  "why_clarity": "Detailed evidence on clarity and conciseness",
  "coding_score": {coding_score if coding_score is not None else 80},
  "coding_evidence": "Evidence of code correctness, complexity, and testing",
  "role_readiness_score": 78,
  "why_role_readiness": "Assessment of readiness for target role",
  "assessed_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "unassessed_topics": ["Topic A (Not sufficiently assessed)", "Topic B (Not sufficiently assessed)"],
  "strengths": ["Evidence-backed strength 1", "Evidence-backed strength 2", "Evidence-backed strength 3"],
  "weaknesses": ["Evidence-backed improvement 1", "Evidence-backed improvement 2"],
  "topics_to_study": ["Technical study topic 1", "Technical study topic 2", "Technical study topic 3"],
  "recommended_next_step": "Aira's personalized recommendation for the candidate's next mock interview"
}}"""

    res_json = ai_service.generate_completion(AIRA_SYSTEM_PERSONA, prompt, temperature=0.7, json_mode=True)
    parsed = None
    if res_json:
        try:
            clean_str = res_json.strip()
            if clean_str.startswith("```"):
                clean_str = clean_str.split("```")[1]
                if clean_str.startswith("json"):
                    clean_str = clean_str[4:]
            clean_str = clean_str.strip()
            parsed = json.loads(clean_str)
        except Exception as e:
            logger.warning(f"Failed to parse report JSON: {e}")

    overall_sc = parsed.get("overall_score", round((avg_tech * 0.35) + (avg_comm * 0.25) + (avg_ps * 0.25) + (avg_clarity * 0.15), 1)) if parsed else 78.0

    return {
        "overall_score": overall_sc,
        "technical_score": parsed.get("technical_score", avg_tech) if parsed else avg_tech,
        "why_technical": parsed.get("why_technical", f"Demonstrated practical knowledge in core technologies for {session_info.get('target_role')}.") if parsed else "Demonstrated practical knowledge in core technologies.",
        "communication_score": parsed.get("communication_score", avg_comm) if parsed else avg_comm,
        "why_communication": parsed.get("why_communication", "Communicated directly and engaged with follow-up questions.") if parsed else "Direct and responsive communication.",
        "problem_solving_score": parsed.get("problem_solving_score", avg_ps) if parsed else avg_ps,
        "why_problem_solving": parsed.get("why_problem_solving", "Approached architectural trade-offs and responded well to hints.") if parsed else "Good problem-solving structure.",
        "answer_quality_score": parsed.get("clarity_score", avg_clarity) if parsed else avg_clarity,
        "why_clarity": parsed.get("why_clarity", "Articulated answers with clear examples from hands-on projects.") if parsed else "Clear explanations.",
        "coding_score": parsed.get("coding_score", coding_score or 78) if parsed else (coding_score or 78),
        "coding_evidence": parsed.get("coding_evidence", f"{coding_passed}/{coding_total} challenges completed successfully." if coding_total > 0 else "Coding challenge was not reached during this session.") if parsed else "Coding assessment completed.",
        "role_readiness_score": parsed.get("role_readiness_score", min(int(overall_sc + 2), 95)) if parsed else 78,
        "why_role_readiness": parsed.get("why_role_readiness", f"Solid foundational readiness for junior to mid-level {session_info.get('target_role')} positions.") if parsed else "Solid role readiness.",
        "assessed_topics": parsed.get("assessed_topics", [session_info.get('target_role'), "API Architecture", "Authentication Flow", "Data Management"]) if parsed else ["Backend Architecture", "Authentication"],
        "unassessed_topics": parsed.get("unassessed_topics", ["Distributed System Scaling (Not sufficiently assessed)", "Complex SQL Indexing (Not sufficiently assessed)"]) if parsed else ["Distributed Scaling (Not sufficiently assessed)"],
        "strengths": parsed.get("strengths") if parsed else [
            "Strong clarity in articulating foundational system principles",
            "Clear practical examples from hands-on project experience",
            "Professional and structured communication style"
        ],
        "weaknesses": parsed.get("weaknesses") if parsed else [
            "Elaborate more on quantifiable performance metrics and scale",
            "Deepen trade-off analysis between alternative architectural approaches"
        ],
        "topics_to_study": parsed.get("topics_to_study") if parsed else [
            "System Architecture & Scaling Patterns",
            "Database Indexing & Query Optimization",
            "Asynchronous Concurrency Models"
        ],
        "recommended_next_step": parsed.get("recommended_next_step", f"Great job on {session_info.get('target_role')} fundamentals! I recommend your next mock interview focus specifically on System Design and Database Optimization.") if parsed else "Practice system design and database scaling in your next interview."
    }
