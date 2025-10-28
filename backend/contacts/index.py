import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage user contacts - search users, add/remove contacts, get contact list
    Args: event with httpMethod, body, queryStringParameters, headers
    Returns: HTTP response with contacts data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'list')
            
            if action == 'search':
                phone = event.get('queryStringParameters', {}).get('phone', '')
                if not phone:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Phone required'})
                    }
                
                cur.execute(
                    "SELECT id, phone, name, status, online FROM users WHERE phone = %s",
                    (phone,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                result = {
                    'id': user[0],
                    'phone': user[1],
                    'name': user[2] or 'Без имени',
                    'status': user[3] or '',
                    'online': user[4] or False
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result)
                }
            
            else:
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Unauthorized'})
                    }
                
                cur.execute("""
                    SELECT u.id, u.phone, u.name, u.status, u.online 
                    FROM users u
                    JOIN contacts c ON u.id = c.contact_id
                    WHERE c.user_id = %s
                    ORDER BY u.name
                """, (user_id,))
                
                contacts = []
                for row in cur.fetchall():
                    contacts.append({
                        'id': row[0],
                        'phone': row[1],
                        'name': row[2] or 'Без имени',
                        'status': row[3] or '',
                        'online': row[4] or False
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(contacts)
                }
        
        elif method == 'POST':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            contact_id = body_data.get('contact_id')
            
            if not contact_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'contact_id required'})
                }
            
            cur.execute(
                "INSERT INTO contacts (user_id, contact_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user_id, contact_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        elif method == 'DELETE':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            contact_id = event.get('queryStringParameters', {}).get('contact_id')
            
            if not contact_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'contact_id required'})
                }
            
            cur.execute(
                "DELETE FROM contacts WHERE user_id = %s AND contact_id = %s",
                (user_id, contact_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
