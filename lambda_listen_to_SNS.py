import json
import boto3

def lambda_handler(event, context):
    print(event)
    
    dynamo_client = boto3.client('dynamodb')
    textract_client = boto3.client('textract')
    api_mgmt_client = boto3.client('apigatewaymanagementapi')
    
    record = event['Records'][0]
    sns_detail = record['Sns']
    message = json.loads(sns_detail['Message'])
    
    job_id = message['JobId']
    job_status = message['Status']
    
    # Fetch connectionId from dynamo using the JobId
    dynamo_response = dynamo_client.query(
        ExpressionAttributeValues={
            ':v1': {
                'S': job_id,
            },
        },
        KeyConditionExpression='jobId = :v1',
        ProjectionExpression='connectionId',
        TableName='AmazonTextractSavedJobs',
    )
    
    connection_id = dynamo_response['Items'][0]['connectionId']['S']
    
    # get result from Textract using JobId
    textract_response = textract_client.get_document_text_detection(
        JobId=job_id,
        MaxResults=1000,
        # NextToken='string'
    )
    
    # Post the result to the connection
    api_mgmt_client.post_to_connection(
        Data=json.dumps(textract_response).encode('utf-8'),
        ConnectionId=connection_id
    )

    # return nothing
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
