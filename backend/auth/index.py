'''
Business: User authentication and registration via phone number
Args: event - dict with httpMethod, body containing phone and optional name
      context - object with attributes: request_id, function_name
Returns: HTTP response with user data or error
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    phone = body_data.get('phone', '').strip()
    name = body_data.get('name', '').strip()
    
    if not phone:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Phone number is required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute("SELECT id, phone, name, status, online FROM users WHERE phone = %s", (phone,))
    user = cur.fetchone()
    
    if user:
        user_id, user_phone, user_name, user_status, user_online = user
        cur.execute("UPDATE users SET online = true, last_seen = CURRENT_TIMESTAMP WHERE id = %s", (user_id,))
        conn.commit()
        
        result = {
            'id': user_id,
            'phone': user_phone,
            'name': user_name or 'Пользователь',
            'status': user_status or '',
            'online': True
        }
    else:
        display_name = name if name else f'Пользователь {phone[-4:]}'
        cur.execute(
            "INSERT INTO users (phone, name, online) VALUES (%s, %s, true) RETURNING id, phone, name, status, online",
            (phone, display_name)
        )
        new_user = cur.fetchone()
        conn.commit()
        
        user_id, user_phone, user_name, user_status, user_online = new_user
        result = {
            'id': user_id,
            'phone': user_phone,
            'name': user_name,
            'status': user_status or '',
            'online': user_online
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(result),
        'isBase64Encoded': False
    }
