import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage chats - create, list, get messages, send messages
    Args: event with httpMethod, body, queryStringParameters, headers
    Returns: HTTP response with chat data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'list')
            
            if action == 'messages':
                chat_id = event.get('queryStringParameters', {}).get('chat_id')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id required'})
                    }
                
                cur.execute("""
                    SELECT m.id, m.text, m.sender_id, m.created_at, u.name
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (chat_id,))
                
                messages = []
                for row in cur.fetchall():
                    messages.append({
                        'id': row[0],
                        'text': row[1],
                        'sender_id': row[2],
                        'time': row[3].strftime('%H:%M') if row[3] else '',
                        'sender_name': row[4] or 'Без имени'
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(messages)
                }
            
            else:
                cur.execute("""
                    SELECT DISTINCT c.id, c.name, c.is_group,
                        (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_time
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    WHERE cm.user_id = %s
                    ORDER BY last_time DESC NULLS LAST
                """, (user_id,))
                
                chats = []
                for row in cur.fetchall():
                    time_str = ''
                    if row[4]:
                        time_str = row[4].strftime('%H:%M')
                    
                    chats.append({
                        'id': row[0],
                        'name': row[1] or 'Чат',
                        'is_group': row[2] or False,
                        'last_message': row[3] or '',
                        'time': time_str
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(chats)
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'create')
            
            if action == 'create':
                contact_id = body_data.get('contact_id')
                if not contact_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'contact_id required'})
                    }
                
                cur.execute("""
                    SELECT c.id FROM chats c
                    JOIN chat_members cm1 ON c.id = cm1.chat_id
                    JOIN chat_members cm2 ON c.id = cm2.chat_id
                    WHERE cm1.user_id = %s AND cm2.user_id = %s AND c.is_group = false
                    LIMIT 1
                """, (user_id, contact_id))
                
                existing = cur.fetchone()
                if existing:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'chat_id': existing[0]})
                    }
                
                cur.execute("SELECT name FROM users WHERE id = %s", (contact_id,))
                contact = cur.fetchone()
                chat_name = contact[0] if contact and contact[0] else 'Чат'
                
                cur.execute(
                    "INSERT INTO chats (name, is_group) VALUES (%s, false) RETURNING id",
                    (chat_name,)
                )
                chat_id = cur.fetchone()[0]
                
                cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user_id))
                cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, contact_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chat_id': chat_id})
                }
            
            elif action == 'send':
                chat_id = body_data.get('chat_id')
                text = body_data.get('text')
                
                if not chat_id or not text:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id and text required'})
                    }
                
                cur.execute(
                    "INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (chat_id, user_id, text)
                )
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': result[0],
                        'time': result[1].strftime('%H:%M') if result[1] else ''
                    })
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
