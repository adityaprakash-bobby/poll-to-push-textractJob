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
    client = boto3.client('textract')
    
    response = client.start_document_text_detection(
        DocumentLocation={
            'S3Object': {
                'Bucket': 'test-lambda-tt',
                'Name': 'docs/Profile.pdf',
                # 'Version': 'string'
            }
        },
        ClientRequestToken='string',
        JobTag='Job' + 'docs_profile_png',
        NotificationChannel={
            'SNSTopicArn': 'arn:aws:sns:us-east-1:323226456632:AmazonTextractJob',
            'RoleArn': 'arn:aws:iam::323226456632:role/SNSFullAccessRole'
        }
    )
    
    job_id = response["JobId"]
    
    return {
        'statusCode': 200,
        'body': json.dumps(job_id),
        'headers': {
            "access-control-allow-origin": "*",
            "cache-control": "no-cache",
            "content-type": "application/json; charset=utf-8",
            "vary": "Accept-Encoding"
        }
    }
