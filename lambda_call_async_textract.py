import json
import boto3

def lambda_handler(event, context):
    # input - image in base64, or multipart form data
    # output - JobId for textract job
    
    # TODO:
    # take the image and put it in a tectract job and return the jobid as reponse to the react application
    # take note of the SNSFullAccessRole role ARN and AmazonTextractJob SNS Topic ARN and use them in the 
    # request of the Textract API
    print(event)
    body = json.loads(event["body"])
    bucket = body["bucket"]
    key = body["objkey"]
    
    client = boto3.client('textract')
    
    response = client.start_document_text_detection(
        DocumentLocation={
            'S3Object': {
                'Bucket': bucket,
                'Name': key,
                # 'Version': 'string'
            }
        },
        ClientRequestToken='Job' + key.replace('/', "_").replace('.', '_'),
        JobTag='Job' + key.replace('/', "_").replace('.', '_'),
        NotificationChannel={
            'SNSTopicArn': 'arn:aws:sns:us-east-1:323226456632:AmazonTextractJob',
            'RoleArn': 'arn:aws:iam::323226456632:role/SNSFullAccessRole'
        }
    )
    
    job_id = response["JobId"]
    print(job_id)
    return {
        'statusCode': 200,
        'body': json.dumps(job_id),
        'headers': {
            "access-control-allow-origin": "*",
            "cache-control": "no-cache",
            "content-type": "application/json; charset=utf-8",
        }
    }
