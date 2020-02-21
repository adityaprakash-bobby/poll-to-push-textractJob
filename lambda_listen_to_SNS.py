import json
import boto3

def lambda_handler(event, context):
    # print(event)
    s3 = boto3.resource('s3')
    dynamo_client = boto3.client('dynamodb')
    textract_client = boto3.client('textract')
    api_mgmt_client = boto3.client(
        'apigatewaymanagementapi',
        endpoint_url="https://ocf3ol0168.execute-api.us-east-1.amazonaws.com/default"
    )
    
    record = event['Records'][0]
    sns_detail = record['Sns']
    message = json.loads(sns_detail['Message'])
    
    job_id = message['JobId']
    job_status = message['Status']
    job_file_save = message['DocumentLocation']['S3ObjectName'].replace('/', '_').replace('.','_') + '.json'
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
    
    # # get result from Textract using JobId
    textract_response = textract_client.get_document_text_detection(
        JobId=job_id,
        MaxResults=1000,
        # NextToken='string'
    )
    print('ConnectionId:', connection_id)
    print(textract_response)
    
    s3object = s3.Object('test-lambda-tt', 'app/' + job_file_save)
    s3object.put(
        Body=(bytes(json.dumps(textract_response).encode('UTF-8')))
    )
    
    # Post the result to the connection
    api_mgmt_client.post_to_connection(
        Data=json.dumps('app/' + job_file_save).encode('utf-8'),
        # Data=json.dumps('Done').encode('utf-8'),
        ConnectionId=connection_id
    )

    # return nothing
    return {
        'statusCode': 200,
        # 'body': json.dumps(textract_response)
        'body': json.dumps('Done')
        
    }
