import psycopg2

def get_connection():
    return psycopg2.connect(
        database="falcon_ai",
        user="postgres"
    )


def create_session(user_id, title, emotion):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO sessions (user_id, title, emotion)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (user_id, title, emotion)
    )
    conn.commit()
    result = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return result


def save_message(session_id, sender, content, emotion):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO messages
        (session_id, sender, content, emotion)
        VALUES (%s, %s, %s, %s)
        """,
        (session_id, sender, content, emotion)
    )
    conn.commit()
    cursor.close()
    conn.close()

def get_sessions(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, emotion, is_archived
        FROM sessions
        WHERE user_id=%s
        ORDER BY id DESC
        """,
        (user_id,)
    )
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return result

def get_messages(session_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT sender, content, emotion
        FROM messages
        WHERE session_id=%s
        ORDER BY id ASC
        """,
        (session_id,)
    )
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return result

def get_chat_history(session_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT sender, content
        FROM messages
        WHERE session_id = %s
        ORDER BY id ASC
        """,
        (session_id,)
    )
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return result

def save_memory(user_id, key, value):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO memories (user_id, memory_key, memory_value)
        VALUES (%s, %s, %s)
    """, (user_id, key, value))

    conn.commit()
    cursor.close()
    conn.close()

def get_memories(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT memory_key, memory_value
        FROM memories
        WHERE user_id = %s
    """, (user_id,))

    memories = cursor.fetchall()

    cursor.close()
    conn.close()

    return memories

def find_memory(user_id, key):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT memory_value
        FROM memories
        WHERE user_id = %s
        AND memory_key = %s
        LIMIT 1
    """, (user_id, key))

    memory = cursor.fetchone()

    cursor.close()
    conn.close()

    return memory

def delete_session(session_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM messages
        WHERE session_id = %s
        """,
        (session_id,)
    )

    cursor.execute(
        """
        DELETE FROM sessions
        WHERE id = %s
        """,
        (session_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()

def archive_session(session_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE sessions
        SET is_archived = TRUE
        WHERE id = %s
        """,
        (session_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()

def unarchive_session(session_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE sessions
        SET is_archived = FALSE
        WHERE id = %s
        """,
        (session_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()

def update_session_title(session_id, title):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE sessions
        SET title = %s
        WHERE id = %s
        """,
        (title, session_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

def create_teaching_session(
    user_id,
    title
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO teaching_sessions
        (
            user_id,
            title
        )
        VALUES
        (%s,%s)
        RETURNING id
        """,
        (
            user_id,
            title
        )
    )

    session_id = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()

    return session_id


def save_teaching_message(
    session_id,
    sender,
    content
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO teaching_messages
        (
            session_id,
            sender,
            content
        )
        VALUES
        (%s,%s,%s)
        """,
        (
            session_id,
            sender,
            content
        )
    )

    conn.commit()
    cursor.close()
    conn.close()


def get_teaching_sessions(
    user_id
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
        id,
        title,
        is_archived
        FROM teaching_sessions
        WHERE user_id=%s
        ORDER BY id DESC
        """,
        (user_id,)
    )

    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return result


def get_teaching_messages(
    session_id
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
        sender,
        content
        FROM teaching_messages
        WHERE session_id=%s
        ORDER BY id ASC
        """,
        (session_id,)
    )

    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return result

def update_teaching_session_title(
    session_id,
    title
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE teaching_sessions
        SET title=%s
        WHERE id=%s
        """,
        (
            title,
            session_id
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

def delete_teaching_session(
    session_id
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM teaching_messages
        WHERE session_id=%s
        """,
        (session_id,)
    )

    cursor.execute(
        """
        DELETE FROM teaching_sessions
        WHERE id=%s
        """,
        (session_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()

def archive_teaching_session(
    session_id
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE teaching_sessions
        SET is_archived = TRUE
        WHERE id = %s
        """,
        (session_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()


def unarchive_teaching_session(
    session_id
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE teaching_sessions
        SET is_archived = FALSE
        WHERE id = %s
        """,
        (session_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()

def get_teaching_session_title(
    session_id
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT title
        FROM teaching_sessions
        WHERE id=%s
        """,
        (session_id,)
    )

    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result:
        return result[0]

    return "Lesson"

def save_material(
    user_id,
    title,
    file_name,
    file_path,
    material_type,
    status="uploaded"
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO materials
        (
            user_id,
            title,
            file_name,
            file_path,
            material_type,
            status
        )
        VALUES
        (%s,%s,%s,%s,%s,%s)
        RETURNING id
    """,
    (
        user_id,
        title,
        file_name,
        file_path,
        material_type,
        status
    ))

    material_id = cursor.fetchone()[0]

    conn.commit()

    cursor.close()
    conn.close()

    return material_id

def update_material_text(
    material_id,
    extracted_text
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE materials
        SET extracted_text = %s
        WHERE id = %s
        """,
        (
            extracted_text,
            material_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

def create_mcq_quiz(
    material_id,
    title
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO mcq_quizzes
        (
            material_id,
            title
        )
        VALUES
        (%s,%s)
        RETURNING id
        """,
        (
            material_id,
            title
        )
    )

    quiz_id = cursor.fetchone()[0]

    conn.commit()

    cursor.close()
    conn.close()

    return quiz_id

def save_mcq_question(
    quiz_id,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    explanation
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO mcq_questions
        (
            quiz_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation
        )
        VALUES
        (%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            quiz_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

def get_mcq_questions(
    quiz_id
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
        FROM mcq_questions
        WHERE quiz_id = %s
        ORDER BY id
        """,
        (quiz_id,)
    )

    questions = cursor.fetchall()

    cursor.close()
    conn.close()

    return questions

def get_material_by_id(
    material_id
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            title,
            extracted_text
        FROM materials
        WHERE id = %s
        """,
        (material_id,)
    )

    material = cursor.fetchone()

    cursor.close()
    conn.close()

    return material

def delete_material(material_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM mcq_questions
        WHERE quiz_id IN (
            SELECT id
            FROM mcq_quizzes
            WHERE material_id = %s
        )
    """, (material_id,))

    cursor.execute("""
        DELETE FROM mcq_quizzes
        WHERE material_id = %s
    """, (material_id,))

    cursor.execute("""
        DELETE FROM materials
        WHERE id = %s
    """, (material_id,))

    conn.commit()

    cursor.close()
    conn.close()


def save_report(user_id, report_type, total, correct, incorrect, unattempted, percentage, quiz_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO reports
        (user_id, type, total, correct, incorrect, unattempted, percentage, quiz_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (user_id, report_type, total, correct, incorrect, unattempted, percentage, quiz_id)
    )
    report_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return report_id


def delete_report(report_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        DELETE FROM reports
        WHERE id = %s
        """,
        (report_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()


def get_reports(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, type, total, correct, incorrect, unattempted, percentage, created_at
        FROM reports
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results