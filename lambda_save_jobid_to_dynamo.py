import json
import boto3

def lambda_handler(event, context):
    print(event)
    # TODO:
    # Save execution job id mapped to the connection id of the webhook connection
    
    dynamo_client = boto3.client('dynamodb')
    
    body = json.loads(event['body'])
    job_id = body['jobid']
    connection_id = event['requestContext']['connectionId']
    
    # Create a connectionId and jobId map in dynamoDB
    response = dynamo_client.put_item(
        Item={
            'jobId': {
                'S': job_id,
            },
            'connectionId': {
                'S': connection_id,
            }
        },
        ReturnConsumedCapacity='TOTAL',
        TableName='AmazonTextractSavedJobs'
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps("Done!")
    }