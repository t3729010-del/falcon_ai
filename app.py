import os
import sys
import subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import json
import base64
import io
import wave
import struct
from flask import send_file
from reportlab.platypus import HRFlowable
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PyPDF2 import PdfReader
from extractor import extract_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

pdfmetrics.registerFont(
    TTFont(
        "NotoSans",
        os.path.join(BASE_DIR, "fonts", "NotoSans-VariableFont_wdth,wght.ttf")
    )
)

pdfmetrics.registerFont(
    TTFont(
        "NotoSansArabic",
        os.path.join(BASE_DIR, "fonts", "NotoSansArabic-VariableFont_wdth,wght.ttf")
    )
)

pdfmetrics.registerFont(
    TTFont(
        "NotoSansSC",
        os.path.join(BASE_DIR, "fonts", "NotoSansSC-VariableFont_wght.ttf")
    )
)

pdfmetrics.registerFont(
    TTFont(
        "NotoSansJP",
        os.path.join(BASE_DIR, "fonts", "NotoSansJP-VariableFont_wght.ttf")
    )
)

pdfmetrics.registerFont(
    TTFont(
        "NotoSansKR",
        os.path.join(BASE_DIR, "fonts", "NotoSansKR-VariableFont_wght.ttf")
    )
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
import tempfile
from database import (
    create_session,
    save_message,
    get_sessions,
    get_messages,
    get_chat_history,
    delete_session,
    archive_session,
    unarchive_session,
    update_session_title,
    create_teaching_session,
    save_teaching_message,
    get_teaching_sessions,
    get_teaching_messages,
    update_teaching_session_title,
    delete_teaching_session,
    archive_teaching_session,
    unarchive_teaching_session,
    get_teaching_session_title,
    save_material,
    get_connection,
    update_material_text,
    get_material_by_id,
    create_mcq_quiz,
    save_mcq_question,
    get_mcq_questions,
    delete_material,
    save_report,
    get_reports,
    delete_report
)

from werkzeug.utils import secure_filename
import os
from database import save_memory, find_memory

# Load .env file
from pathlib import Path

# Load .env file from Falcon_AI root folder
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Get API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

print("OPENROUTER =", OPENROUTER_API_KEY)
print("HF =", HF_API_KEY)


# Create Flask app
app = Flask(__name__)
CORS(app)

# =========================
# VOSK SPEECH RECOGNITION
# =========================

vosk_model = None
try:
    from vosk import Model, KaldiRecognizer
    vosk_model = Model(model_name="vosk-model-small-en-us-0.15")
    print("[VOSK] Model loaded successfully")
except Exception as e:
    print(f"[VOSK] Failed to load model: {e}")

# Falcon personality
FALCON_PROMPT = """
You are Falcon AI, an emotional support assistant.

Rules:
- Be kind and supportive.
- Help with motivation, stress, anxiety, burnout and loneliness.
- Speak like a caring psychologist and mentor.
- Keep responses positive and encouraging.
- Never judge the user.
- Never diagnose medical conditions.
- Keep answers concise.
"""

from textblob import TextBlob

def detect_emotion(text):

    polarity = TextBlob(text).sentiment.polarity

    if polarity > 0.3:
        return "happy"

    elif polarity < -0.3:
        return "sad"

    else:
        return "neutral"

def generate_reply(prompt):

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {
                "role": "system",
                "content": FALCON_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=data
    )

    result = response.json()

    print("OPENROUTER RESPONSE:")
    print(result)

    if "error" in result:
        return f"OpenRouter Error: {result['error']['message']}"

    return result["choices"][0]["message"]["content"]

def generate_reply_stream(prompt):

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {
                "role": "system",
                "content": FALCON_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": True
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=data,
        stream=True,
        timeout=120
    )

    full_reply = ""

    for line in response.iter_lines():
        if not line:
            continue
        line = line.decode("utf-8")
        if not line.startswith("data: "):
            continue
        payload = line[6:]
        if payload.strip() == "[DONE]":
            break
        try:
            chunk = json.loads(payload)
            delta = chunk["choices"][0].get("delta", {})
            token = delta.get("content", "")
            if token:
                full_reply += token
                yield f"data: {token}\n\n"
        except (json.JSONDecodeError, KeyError, IndexError):
            continue

    yield "data: [DONE]\n\n"

@app.route("/chat-stream", methods=["POST"])
def chat_stream():
    try:
        data = request.json
        user_message = data.get("message", "")
        message_lower = user_message.lower()
        session_id = data.get("session_id")
        history = get_chat_history(session_id)

        if "my name is" in message_lower:
            name = user_message[10:].strip()
            save_memory(1, "name", name)

        if "what is my name" in message_lower:
            memory = find_memory(1, "name")
            if memory:
                def emit_name():
                    yield f"data: Your name is {memory[0]}.\n\n"
                    yield "data: [DONE]\n\n"
                return Response(
                    stream_with_context(emit_name()),
                    content_type="text/event-stream"
                )

        conversation_text = ""
        for sender, content in history:
            if sender == "user":
                conversation_text += f"\nUser: {content}"
            else:
                conversation_text += f"\nFalcon: {content}"

        prompt = f"""
        {FALCON_PROMPT}

        Previous Conversation:
        {conversation_text}

        User: {user_message}
        Falcon:
        """

        emotion = detect_emotion(user_message)

        save_message(session_id, "user", user_message, emotion)

        def generate():
            full_reply = ""
            for token in generate_reply_stream(f"""
            Emotion: {emotion}

            {prompt}
            """):
                if token.startswith("data: ") and token[6:].strip() != "[DONE]":
                    full_reply += token[6:]
                yield token

            save_message(session_id, "falcon", full_reply, emotion)
            title = user_message[:40]
            update_session_title(session_id, title)

        return Response(
            stream_with_context(generate()),
            content_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        def emit_error():
            yield f"data: Error: {str(e)}\n\n"
            yield "data: [DONE]\n\n"
        return Response(
            stream_with_context(emit_error()),
            content_type="text/event-stream"
        )

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message", "")
        message_lower = user_message.lower()
        history = data.get("history",[])
        session_id = data.get("session_id")
        history = get_chat_history(session_id)

        if "my name is" in message_lower:

            name = user_message[10:].strip()

            save_memory(
                1,
                "name",
                name
            )
        
        if "what is my name" in message_lower:

            memory = find_memory(
                1,
                "name"
            )

            if memory:

                return jsonify({
                    "reply": f"Your name is {memory[0]}."
                })

        conversation_text = ""

        for sender, content in history:

            if sender == "user":
                conversation_text += f"\nUser: {content}"

            else:
                conversation_text += f"\nFalcon: {content}"

        prompt = f"""
        {FALCON_PROMPT}

        Previous Conversation:
        {conversation_text}

        User: {user_message}
        Falcon:
        """

        emotion = detect_emotion(user_message)

        user_id = 1

        save_message(
            session_id,
            "user",
            user_message,
            emotion
        )

        reply = generate_reply(
            f"""
            Emotion: {emotion}

            {prompt}
            """
        )

        save_message(
            session_id,
            "falcon",
            reply,
            emotion
        )

        title = user_message[:40]

        update_session_title(
            session_id,
            title
        )

        return jsonify({
            "reply": reply,
            "title": title,
            "emotion": emotion
        })
        
        

    except Exception as e:
        return jsonify({
            "reply": f"Error: {str(e)}"
        })

@app.route("/create_session", methods=["GET"])
def create_new_session():

    user_id = 1

    session_id = create_session(
        user_id,
        "New Conversation",
        "neutral"
    )

    return jsonify({
        "session_id": session_id
    })

@app.route("/delete_session/<int:session_id>",
           methods=["DELETE"])
def remove_session(session_id):

    delete_session(session_id)

    return jsonify({
        "success": True
    })

@app.route(
    "/archive_session/<int:session_id>",
    methods=["POST"]
)
def archive_chat(session_id):

    archive_session(session_id)

    return jsonify({
        "success": True
    })

@app.route(
    "/unarchive_session/<int:session_id>",
    methods=["POST"]
)
def unarchive_chat(session_id):

    unarchive_session(session_id)

    return jsonify({
        "success": True
    })

@app.route("/sessions", methods=["GET"])
def load_sessions():

    user_id = 1

    sessions = get_sessions(user_id)

    result = []

    for session in sessions:
        result.append({
            "id": session[0],
            "title": session[1],
            "emotion": session[2],
            "is_archived": session[3]
        })

    return jsonify(result)

@app.route("/messages/<int:session_id>", methods=["GET"])
def load_messages(session_id):

    messages = get_messages(session_id)

    result = []

    for message in messages:
        result.append({
            "sender": message[0],
            "content": message[1],
            "emotion": message[2]
        })

    return jsonify(result)

@app.route("/text-chat", methods=["POST"])
def text_chat():

    data = request.json

    user_message = data.get("message", "")
    title = user_message[:40]
    session_id = data.get("session_id")

    if session_id:
        
        current_title = get_teaching_session_title(
            session_id
        )
        if current_title == "New Lesson":
            update_teaching_session_title(
                session_id,
                title
            )

    if session_id:

        save_teaching_message(
            session_id,
            "user",
            user_message
        )

    TEACHER_PROMPT = """
    You are Falcon AI, an expert teacher.

    Explain concepts clearly.
    Use simple language.
    Give examples.
    Teach step by step.

    IMPORTANT:
    - Do not use markdown.
    - Do not use **bold**.
    - Do not use # headings.
    - Do not use tables.
    - Write in normal paragraphs.
    - Keep responses conversational.
    """

    try:

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "openai/gpt-oss-120b:free",
            "messages": [
                {
                    "role": "system",
                    "content": TEACHER_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )

        result = response.json()

        reply = result["choices"][0]["message"]["content"]

        if session_id:
            save_teaching_message(
                session_id,
                "ai",
                reply
            )

        return jsonify({
            "reply": reply
        })

    except Exception as e:

        return jsonify({
            "reply": f"Error: {str(e)}"
        })
    
@app.route(
    "/create_teaching_session",
    methods=["GET"]
)
def create_new_teaching_session():

    user_id = 1

    session_id = create_teaching_session(
        user_id,
        "New Lesson"
    )

    return jsonify({
        "session_id": session_id
    })

@app.route(
    "/teaching_sessions",
    methods=["GET"]
)
def load_teaching_sessions():

    user_id = 1

    sessions = get_teaching_sessions(
        user_id
    )

    result = []

    for session in sessions:

        result.append({
            "id": session[0],
            "title": session[1],
            "is_archived": session[2]
        })

    return jsonify(result)

@app.route(
    "/teaching_messages/<int:session_id>",
    methods=["GET"]
)
def load_teaching_messages(
    session_id
):

    messages = get_teaching_messages(
        session_id
    )

    result = []

    for message in messages:

        result.append({
            "sender": message[0],
            "content": message[1]
        })

    return jsonify(result)


@app.route(
    "/delete_teaching_session/<int:session_id>",
    methods=["DELETE"]
)
def delete_teaching_session_route(
    session_id
):

    delete_teaching_session(
        session_id
    )

    return jsonify({
        "success": True
    })

@app.route(
    "/archive_teaching_session/<int:session_id>",
    methods=["POST"]
)
def archive_teaching_route(
    session_id
):

    archive_teaching_session(
        session_id
    )

    return jsonify({
        "success": True
    })


@app.route(
    "/unarchive_teaching_session/<int:session_id>",
    methods=["POST"]
)
def unarchive_teaching_route(
    session_id
):

    unarchive_teaching_session(
        session_id
    )

    return jsonify({
        "success": True
    })

def get_font_for_text(text):

    # Chinese
    if any('\u4e00' <= ch <= '\u9fff' for ch in text):
        return "NotoSansSC"

    # Japanese
    if any('\u3040' <= ch <= '\u30ff' for ch in text):
        return "NotoSansJP"

    # Korean
    if any('\uac00' <= ch <= '\ud7af' for ch in text):
        return "NotoSansKR"

    # Arabic / Urdu
    if any('\u0600' <= ch <= '\u06ff' for ch in text):
        return "NotoSansArabic"

    return "NotoSans"

def fix_rtl_text(text):

    reshaped_text = arabic_reshaper.reshape(text)

    return get_display(
        reshaped_text
    )

@app.route(
    "/export_teaching_pdf/<int:session_id>",
    methods=["GET"]
)

def export_teaching_pdf(
    session_id
):

    title = get_teaching_session_title(
        session_id
    )

    messages = get_teaching_messages(
        session_id
    )

    conversation_text = ""

    for sender, message in messages:

        conversation_text += (
            f"{sender}: {message}\n\n"
        )

    summary_prompt = f"""
    Create a study report.

    IMPORTANT:
    - Use the SAME language as the lesson.
    - If the lesson is Urdu, write the report in Urdu.
    - If the lesson is Japanese, write the report in Japanese.
    - If the lesson is Chinese, write the report in Chinese.

    Use bullet points.

    Format:

    SUMMARY

    - point
    - point

    KEY CONCEPTS

    - concept
    - concept

    STUDY TIPS

    - tip
    - tip

    Lesson:

    {conversation_text}
    """


    headers = {
        "Authorization":
        f"Bearer {OPENROUTER_API_KEY}",

        "Content-Type":
        "application/json"
    }

    payload = {
        "model":
        "openai/gpt-oss-120b:free",

        "messages":[
            {
                "role":"user",
                "content":summary_prompt
            }
        ]
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload
    )

    result = response.json()

    if "choices" in result:
        summary = (
            result["choices"][0]
            ["message"]
            ["content"]
        )
        summary = (
            summary
            .replace("**SUMMARY**", "SUMMARY")
            .replace("**KEY CONCEPTS**", "KEY CONCEPTS")
            .replace("**STUDY TIPS**", "STUDY TIPS")
            .replace("**", "")
        )
        print(summary)
    else:

        summary ="Summary could not be generated."

    selected_font = get_font_for_text(
        conversation_text + summary
    )

    if selected_font == "NotoSansArabic":

        title = fix_rtl_text(title)
        summary = fix_rtl_text(summary)

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    )

    doc = SimpleDocTemplate(
        temp_file.name
    )

    styles = getSampleStyleSheet()
    titleStyle = ParagraphStyle(
        "Title",
        parent = styles["Title"],
        textColor = colors.HexColor("#2563EB"),
        fontName = selected_font
    )
    headingStyle = ParagraphStyle(
        "Heading",
        parent = styles["Heading2"],
        textColor = colors.HexColor("#111827"),
        fontName = selected_font
    )
    bodyStyle = ParagraphStyle(
        "Body",
        parent = styles["BodyText"],
        leading=18,
        fontName = selected_font
    )
    
    from reportlab.lib.enums import TA_RIGHT
    urduStyle = ParagraphStyle(
        "Urdu",
        parent = bodyStyle,
        fontName = "NotoSansArabic",
        alignment = TA_RIGHT
    )
    urduHeadingStyle = ParagraphStyle(
        "UrduHeading",
        parent = headingStyle,
        fontName="NotoSansArabic",
        alignment=TA_RIGHT
    )

    if selected_font == "NotoSansArabic":
        current_body_style = urduStyle
        current_heading_style = urduHeadingStyle
    else:
        current_body_style = bodyStyle
        current_heading_style = headingStyle
    content = []

    content.append(
        Paragraph(
            "FALCON AI LEARNING REPORT",
            titleStyle
        )
    )

    content.append(
        Spacer(1,15)
    )

    content.append(
        Paragraph(
            f"Lesson: {title}",
            current_heading_style
        )
    )

    content.append(
        Spacer(1,10)
    )

    content.append(
        Paragraph(
            "- - - - - - - - - - - - - - - -",
            current_body_style
        )
    )

    content.append(
        Paragraph(
            "Lesson Summary",
            current_heading_style
        )
    )
    
    for line in summary.split("\n"):

        line = line.strip()

        if not line:
            continue

        if line in [
            "SUMMARY",
            "KEY CONCEPTS",
            "STUDY TIPS",
            "سبق کا خلاصہ",
            "اہم تصورات",
            "مطالعہ کے مشورے"
        ]:

            content.append(
                Paragraph(
                    line,
                    current_heading_style
                )
            )

            content.append(
                Spacer(1, 8)
            )

        else:

            content.append(
                Paragraph(
                    line,
                    current_body_style
                )
            )

        content.append(
            Spacer(1, 3)
        )

    content.append(
        HRFlowable(
            width="100%"
        )
    ) 
    content.append(
        Spacer(1,30)
    )

    content.append(
        Paragraph(
            "- - - - - - - - - - - - - - -",
            current_body_style
        )
    )

    content.append(
        Paragraph(
            "CONVERSATION",
            current_heading_style
        )
    )

    content.append(
        Paragraph(
            "- - - - - - - - - - - - - - - -",
            current_body_style
        )
    )

    for sender, message in messages:

        label = "Falcon AI" if sender == "ai" else "User"

        content.append(
            Paragraph(
                f"<b>{label}</b>",
                current_heading_style
            )
        )

        for line in message.split("\n"):

            line = line.strip()

            if not line:
                continue

            if selected_font == "NotoSansArabic":
                line = fix_rtl_text(line)

            content.append(
                Paragraph(
                    line,
                    current_body_style
                )
            )

            content.append(
                Spacer(1, 4)
            )

        content.append(
            Spacer(1,8)
        )

    content.append(
        Spacer(1,12)
    )
    

    doc.build(content)

    safe_title = (
        title
        .replace("/", "-")
        .replace("\\", "-")
        .replace(":", "-")
        .replace("?", "")
    )

    return send_file(
        temp_file.name,
        as_attachment=True,
        download_name=
        f"{safe_title}.pdf"
    )

from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

@app.route(
    "/upload_material",
    methods=["POST"]
)
def upload_material():

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "message": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":

        return jsonify({
            "success": False,
            "message": "Empty filename"
        }), 400

    filename = secure_filename(
        file.filename
    )

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    file.save(filepath)

    extension = filename.split(".")[-1].lower()

    try:

        material_id = save_material(
            user_id=1,
            title = os.path.splitext(filename)[0],
            file_name=filename,
            file_path=filepath,
            material_type=extension,
            status="uploaded"
        )
        

            
        extracted_text = extract_text(
            filepath,
            extension
        )
        print("TEXT LENGTH:",len(extracted_text))
        print(extracted_text[:500])

        update_material_text(
            material_id,
            extracted_text
        )

        print(
            "Extracted",
            len(extracted_text),
            "characters"
        )

        print("Material saved:", material_id)

    except Exception as e:

        print("DATABASE ERROR:")
        print(str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    return jsonify({
        "success": True,
        "material_id": material_id,
        "filename": filename
    })

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

@app.route("/materials", methods=["GET"])
def get_materials():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            title,
            material_type,
            upload_date
        FROM materials
        ORDER BY id DESC
    """)

    materials = cursor.fetchall()

    cursor.close()
    conn.close()

    result = []

    for material in materials:

        result.append({
            "id": material[0],
            "title": material[1],
            "type": material[2],
            "upload_date": str(material[3])
        })

    return jsonify(result)

@app.route(
    "/generate_mcq/<int:material_id>",
    methods=["POST"]
)
def generate_mcq(material_id):

    material = get_material_by_id(
        material_id
    )

    if not material:

        return jsonify({
            "success": False,
            "error": "Material not found"
        }), 404

    material_title = material[1]
    extracted_text = material[2]

    print("MATERIAL =", material)
    print("TEXT =", extracted_text[:200] if extracted_text else "EMPTY")

    print("TEXT LENGTH =",len(extracted_text))
    print("TEXT SAMPLE:",extracted_text[:500] if extracted_text else "EMPTY")

    if not extracted_text:

        return jsonify({
            "success": False,
            "error": "No extracted text found"
        }), 400

    prompt = f"""
Generate 10 multiple choice questions.

Return ONLY valid JSON.

Format:

[
    {{
        "question":"...",
        "option_a":"...",
        "option_b":"...",
        "option_c":"...",
        "option_d":"...",
        "correct_answer":"A",
        "explanation":"..."
    }}
]

Study Material:

{extracted_text[:12000]}
"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload
    )

    print("OPENROUTER RESPONSE:")
    print(response.text)

    result = response.json()

    if "choices" not in result:
        # Retry with fallback model
        payload["model"] = "mistralai/mistral-7b-instruct:free"
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        result = response.json()
        print("FALLBACK RESPONSE:")
        print(response.text)

    if "choices" not in result:
        return jsonify({
            "success": False,
            "error": "OpenRouter failed: " + str(result.get("error", result))
        }), 500

    content = (
        result["choices"][0]
        ["message"]
        ["content"]
    )

    print(content)
    content = content.replace(
        "```json",
        ""
    ).replace(
        "```",
        ""
    ).strip()

    try:
        questions = json.loads(content)
    except json.JSONDecodeError as e:
        print("JSON PARSE ERROR:", e)
        print("RAW CONTENT:", content)
        return jsonify({
            "success": False,
            "error": "AI returned invalid JSON. Please try again."
        }), 500

    print("QUESTIONS GENERATED:")
    print(len(questions))

    quiz_id = create_mcq_quiz(
        material_id,
        material_title
    )

    for q in questions:

        save_mcq_question(
            quiz_id,
            q["question"],
            q["option_a"],
            q["option_b"],
            q["option_c"],
            q["option_d"],
            q["correct_answer"],
            q["explanation"]
        )

    return jsonify({
        "success": True,
        "quiz_id": quiz_id,
        "questions_saved": len(questions)
    })

@app.route(
    "/generate_selected_quiz",
    methods=["POST"]
)
def generate_selected_quiz():
  try:
    data = request.json

    material_ids = data.get(
        "material_ids",
        []
    )

    question_count = data.get(
        "question_count",
        10
    )

    if not material_ids:

        return jsonify({
            "success": False,
            "error": "No materials selected"
        }), 400

    combined_text = ""
    material_title = "Combined Materials"

    for material_id in material_ids:

        material = get_material_by_id(
            material_id
        )

        if material and material[2]:

            combined_text += (
                "\n\n" +
                material[2]
            )

    if not combined_text:

        return jsonify({
            "success": False,
            "error": "No extracted text found"
        }), 400
    
    prompt = f"""
    Generate {question_count} multiple choice questions.

    Return ONLY valid JSON.

    Format:

    [
        {{
            "question":"...",
            "option_a":"...",
            "option_b":"...",
            "option_c":"...",
            "option_d":"...",
            "correct_answer":"A",
            "explanation":"..."
        }}
    ]

    Study Material:

    {combined_text[:12000]}
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "openai/gpt-oss-120b:free",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    print("COMBINED TEXT LENGTH =",len(combined_text))
    print("MATERIAL COUNT =",len(material_ids))

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload
    )

    result = response.json()

    print("OPENROUTER RESPONSE:")
    print(response.text)

    if "choices" not in result:
        # Retry with fallback model
        payload["model"] = "mistralai/mistral-7b-instruct:free"
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        result = response.json()
        print("FALLBACK RESPONSE:")
        print(response.text)

    if "choices" not in result:
        return jsonify({
            "success": False,
            "error": "OpenRouter failed: " + str(result.get("error", result)),
            "response": result
        }), 500

    content = (
        result["choices"][0]
        ["message"]
        ["content"]
    )

    content = content.replace(
        "```json",
        ""
    ).replace(
        "```",
        ""
    ).strip()

    try:
        questions = json.loads(content)
    except json.JSONDecodeError as e:
        print("JSON PARSE ERROR:", e)
        print("RAW CONTENT:", content)
        return jsonify({
            "success": False,
            "error": "AI returned invalid JSON. Please try again."
        }), 500

    print("SAVING QUIZ FOR MATERIAL =", material_ids[0])

    quiz_id = create_mcq_quiz(
        material_ids[0],
        material_title
    )

    required_keys = [
        "question","option_a","option_b",
        "option_c","option_d",
        "correct_answer","explanation"
    ]

    saved_count = 0

    for q in questions:

        missing = [
            k for k in required_keys
            if k not in q
        ]

        if missing:

            print(
                "SKIPPING QUESTION, missing keys:",
                missing
            )

            continue

        save_mcq_question(
            quiz_id,
            q["question"],
            q["option_a"],
            q["option_b"],
            q["option_c"],
            q["option_d"],
            q["correct_answer"],
            q["explanation"]
        )

        saved_count += 1

    return jsonify({
        "success": True,
        "quiz_id": quiz_id,
        "questions_saved": saved_count
    })

  except Exception as e:
    print("GENERATE QUIZ ERROR:", str(e))
    return jsonify({
        "success": False,
        "error": "AI returned malformed questions. Please try again."
    }), 500

@app.route(
    "/mcq_questions/<int:quiz_id>",
    methods=["GET"]
)
def load_mcq_questions(quiz_id):

    questions = get_mcq_questions(
        quiz_id
    )

    result = []

    for q in questions:

        result.append({
            "question": q[0],
            "option_a": q[1],
            "option_b": q[2],
            "option_c": q[3],
            "option_d": q[4],
            "correct_answer": q[5],
            "explanation": q[6]
        })

    return jsonify(result)

@app.route("/test_mcq/<int:material_id>")
def test_mcq(material_id):

    return generate_mcq(material_id)

@app.route(
    "/material/<int:material_id>",
    methods=["DELETE"]
)
def delete_material_route(material_id):

    delete_material(material_id)

    return jsonify({
        "success": True
    })

@app.route("/save_report", methods=["POST"])
def save_report_route():
    try:
        data = request.get_json()
        report_id = save_report(
            user_id=1,
            report_type=data["type"],
            total=data["total"],
            correct=data["correct"],
            incorrect=data["incorrect"],
            unattempted=data.get("unattempted", 0),
            percentage=data["percentage"],
            quiz_id=data.get("quiz_id")
        )
        return jsonify({"success": True, "report_id": report_id})
    except Exception as e:
        print("SAVE REPORT ERROR:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/reports", methods=["GET"])
def get_reports_route():
    try:
        rows = get_reports(user_id=1)
        reports = []
        for r in rows:
            reports.append({
                "id": r[0],
                "type": r[1],
                "total": r[2],
                "correct": r[3],
                "incorrect": r[4],
                "unattempted": r[5],
                "percentage": float(r[6]),
                "created_at": r[7].isoformat()
            })
        return jsonify(reports)
    except Exception as e:
        print("GET REPORTS ERROR:", str(e))
        return jsonify([]), 500


@app.route("/delete_report/<int:report_id>", methods=["DELETE"])
def delete_report_route(report_id):
    try:
        delete_report(report_id)
        return jsonify({"success": True})
    except Exception as e:
        print("DELETE REPORT ERROR:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/generate_avatar", methods=["POST"])
def generate_avatar():
    """
    Image-to-avatar generation pipeline with automatic provider fallback.

    Provider chain (auto-detected at startup):
      1. IdentityProvider       — IP-Adapter-FaceID + SD1.5 (face-embedding-preserving)
      2. ComfyUIProvider        — local ComfyUI on localhost:8188
      3. LocalProvider          — diffusers + SD2.1 local inference
      4. HuggingFaceProvider    — free api-inference.huggingface.co (NOT paid Inference Providers)
      5. BrowserFallbackProvider — signals frontend to use Canvas-based processing

    Never returns the original uploaded image.
    """
    data = request.json
    image_data = data.get("image", "")

    raw = image_data
    if "," in raw:
        raw = raw.split(",")[1]

    try:
        image_bytes = base64.b64decode(raw)
    except Exception as e:
        print(f"[AVATAR] Base64 decode failed: {e}")
        return jsonify({"success": False, "error": "Invalid image data"}), 400

    print(f"[AVATAR] Request: {len(image_bytes)} bytes ({len(image_bytes) / 1024:.1f}KB)")

    from avatar_manager import generate_avatar as manager_generate

    result = manager_generate(image_bytes)
    return jsonify(result), 200 if result.get("success") else 200 if result.get("use_browser_fallback") else 500


@app.route("/avatar/diagnostics", methods=["GET"])
def avatar_diagnostics():
    """Admin diagnostics endpoint — shows provider status."""
    from avatar_manager import get_diagnostics
    return jsonify(get_diagnostics())


# =========================
# SPEECH-TO-TEXT ENDPOINT
# =========================

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    """Transcribe audio blob (WebM/Opus) to text using Vosk."""
    if vosk_model is None:
        return jsonify({"error": "Speech recognition model not loaded"}), 503

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    print(f"[VOSK] Received audio: {audio_file.filename} ({audio_file.content_type})")

    try:
        import soundfile as sf
        import numpy as np
        from vosk import KaldiRecognizer

        webm_data = audio_file.read()

        wav_io = io.BytesIO()
        tmp_path = "/tmp/vosk_input.webm"
        with open(tmp_path, "wb") as f:
            f.write(webm_data)

        try:
            import subprocess
            pcm_path = "/tmp/vosk_input.wav"
            subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_path, "-ar", "16000", "-ac", "1", "-f", "wav", pcm_path],
                capture_output=True, timeout=10
            )
            audio_data, samplerate = sf.read(pcm_path, dtype="int16")
        except Exception as conv_err:
            print(f"[VOSK] ffmpeg conversion failed: {conv_err}")
            audio_data, samplerate = sf.read(io.BytesIO(webm_data), dtype="int16")
            if len(audio_data.shape) > 1:
                audio_data = audio_data[:, 0]

        rec = KaldiRecognizer(vosk_model, 16000)
        rec.SetWords(True)

        chunk_size = 4000
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i:i + chunk_size]
            rec.AcceptWaveform(chunk.tobytes())

        result = json.loads(rec.FinalResult())
        transcript = result.get("text", "").strip()
        print(f"[VOSK] Transcript: '{transcript}'")

        return jsonify({"transcript": transcript})

    except Exception as e:
        print(f"[VOSK] Transcription error: {e}")
        return jsonify({"error": str(e)}), 500


# =========================
# TEXT-TO-SPEECH (espeak-ng)
# =========================

@app.route("/tts", methods=["POST"])
def tts():
    """Generate speech audio from text using espeak-ng."""
    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "No text provided"}), 400

        output_path = "/tmp/falcon_tts.wav"
        result = subprocess.run(
            ["espeak-ng", "-v", "en", "-s", "130", "-p", "50", "-w", output_path, text],
            capture_output=True, timeout=30
        )
        if result.returncode != 0:
            return jsonify({"error": f"espeak-ng failed: {result.stderr.decode()}"}), 500

        return send_file(output_path, mimetype="audio/wav", as_attachment=False)

    except Exception as e:
        print(f"[TTS] Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=False)