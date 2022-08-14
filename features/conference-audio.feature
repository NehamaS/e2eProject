Feature: mMCU Cluster Health - audio =>

  @TMU-18457
  @sanity
  @audio
#  @data-channel
  Scenario: basic audio conference room
    Given System is running on MCU_HOME
    Given create conference 100006
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
  #  When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType |
      #| chandler    | context   | data-channel | sender   |
      | ross        | context   | audio    | sender   |
     # | ross        | context   | data-channel | sender   |
    And leave participant:
      | Participant | meetingID | roomType |
    #  | ross        | context   | data-channel |
   #   | chandler    | context   | data-channel |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
  #  Then destroy data-channel room
    Then destroy audio room

  @audio
  @error-test
  @TMU-18432---18456
  Scenario: audio conference room, missing caller id - return Error on header
    Given System is running on MCU_HOME
    Given create conference 100007
    When create audio room for host chandler
    And add participant chandler in meetingID context with roomType audio with header error MISSING_CALLER_ID
    Then chandler should get errorCode: 500, errorReason: Create Video Track Failed response on INVITE audio roomType
    Then destroy audio room

  @audio
  @error-test
  @TMU-19451
  Scenario: add user to not exist meeting
    Given System is running on MCU_HOME
    Given create conference 100008
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with error NOT_EXIST_MEETING
    Then chandler should get errorCode: 493, errorReason: P-Meeting-Id does not exist response on INVITE audio roomType
    Then destroy audio room

  @audio
  @error-test
  @TMU-19532
  Scenario: add user with wrong SDP
    Given System is running on MCU_HOME
    Given create conference 100009
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with error AUDIO_WRONG_SDP
    Then chandler should get errorCode: 500, errorReason: Missing Audio Stream response on INVITE audio roomType
    Then destroy audio room

  @audio
  @error-test
  @TMU-19533
  Scenario: add user with wrong msml
    Given System is running on MCU_HOME
    Given create conference 100005
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with error AUDIO_WRONG_MSML
    Then chandler should get errorCode: 500 response on INFO audio roomType
    Then destroy audio room




#
#  @TMU-19536
#  @audio
#  @data-channel
#  Scenario: open audio and DC rooms in parallel
#    Given System is running on MCU_HOME
#    Given create conference 100012
#    And create rooms:
#      | roomType     | conference | Participant |
#      | data-channel | context    | chandler    |
#      | audio        | context    | chandler    |
#    And add participant:
#      | Participant | meetingID | roomType     |
#      | chandler    | context   | audio        |
#      | ross        | context   | audio        |
#      | chandler    | context   | data-channel |
#      | ross        | context   | data-channel |
#    And leave participant:
#      | Participant | meetingID | roomType     |
#      | ross        | context   | audio        |
#      | chandler    | context   | audio        |
#      | ross        | context   | data-channel |
#      | chandler    | context   | data-channel |
#    Then destroy audio room
#    Then destroy data-channel room

  @TMU-18469
  @audio
  @mute
  @stream
 # @data-channel
  Scenario: audio conference room, mute and unmute
    Given System is running on MCU_HOME
    Given create conference 100013
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType |
     # | chandler    | context   | data-channel | receiver |
      | ross        | context   | audio    | receiver |
     # | ross        | context   | data-channel | receiver |
      | joe         | context   | audio    | receiver |
     # | joe         | context   | data-channel | receiver |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
      | joe         | context   | audio    | audio3     |
    And mute ross
    Then Sleep 10 sec in case STREAM set to TRUE
    And unmute ross
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType |
     # | ross        | context   | data-channel |
     # | chandler    | context   | data-channel |
    #  | joe         | context   | data-channel |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
      | joe         | context   | audio    |
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | joe         | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | joe         | context   | audio    |
   # Then destroy data-channel room
    Then destroy audio room

  @TMU-18547
  @audio
  @mute
  @stream
  @mute
 # @data-channel
  Scenario: audio conference room, muteAll and unmuteAll
    Given System is running on MCU_HOME
    Given create conference 100019
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType |
    #  | chandler    | context   | data-channel | receiver |
      | ross        | context   | audio    | receiver |
     # | ross        | context   | data-channel | receiver |
      | joe         | context   | audio    | receiver |
     # | joe         | context   | data-channel | receiver |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
      | joe         | context   | audio    | audio3     |
    And ross muteAll
    Then Sleep 10 sec in case STREAM set to TRUE
    And ross unmuteAll
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType |
    #  | ross        | context   | data-channel |
    #  | chandler    | context   | data-channel |
    #  | joe         | context   | data-channel |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
      | joe         | context   | audio    |
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | joe         | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | joe         | context   | audio    |
  #  Then destroy data-channel room
    Then destroy audio room

  @TMU-19630
  @audio
  @error-test
  Scenario: not supported codec in audio mid - return Error on SDP
    Given System is running on MCU_HOME
    Given create conference 100017
    When create audio room for host chandler
    And add participant chandler in meetingID context with roomType audio with sdp error NOT_SUPPORTED_CODEC_IN_AUDIO_MID
    Then chandler should get errorCode: 500, errorReason: Unsupported Audio response on INVITE audio roomType
    Then destroy audio room



  @error-test
  @TMU-19632
  @audio
  Scenario: leaveParticipnat after destroy room - return Error
    Given System is running on MCU_HOME
    Given create conference 100015
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
    Then destroy audio room
    And Failed leave participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |

  @error-test
  @TMU-19633
  @audio
  Scenario: destroy destroyed room - return error
    Given System is running on MCU_HOME
    Given create conference 100016
    When create audio room for host chandler
    Then destroy audio room
    Then Failed destroy audio room

  @audio
  @TMU-19979
  @MCU-1987
  Scenario: create room twice and destroy twice
    Given System is running on MCU_HOME
    Given create conference 100016
    When create audio room for host chandler
    When create audio room for host chandler
    Then destroy audio room
    Then Failed destroy audio room

  @audio
  @TMU-20030
  @MCU-1987
  Scenario: create room twice with user and destroy twice
    Given System is running on MCU_HOME
    Given create conference 100019
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
    When create audio room for host chandler
    Then destroy audio room
    Then Failed destroy audio room

  @audio
  @error-test
  @TMU-20033
  Scenario: create room with sdp - return error
    Given System is running on MCU_HOME
    Given create conference 100020
    When create audio room for host chandler with error CREATE_ROOM_WITH_SDP
    Then chandler should get errorCode: 493, errorReason: P-Meeting-Id does not exist response on INVITE audio roomType

  @audio
  @hold
  @hold-sdp
  Scenario: hold unhold happy path
    Given System is running on MCU_HOME
    Given create conference 100017
    When create audio room for host user1
    And add participant:
      | Participant | meetingID | roomType | userType |
      | user1       | context   | audio    | sender   |
      | user2       | context   | audio    | sender   |
    Then hold user2 interface typ: sdp
    Then unhold user2 interface typ: sdp
    And leave participant:
      | Participant | meetingID | roomType |
      | user2       | context   | audio    |
      | user1       | context   | audio    |
    Then destroy audio room

  @audio
  @hold
  @hold-sip
  Scenario: hold unhold sip interface
    Given System is running on MCU_HOME
    Given create conference 100018
    When create audio room for host user1
    And add participant:
      | Participant | meetingID | roomType | userType |
      | user1       | context   | audio    | sender   |
      | user2       | context   | audio    | sender   |
    Then hold user2 interface typ: sip
    Then unhold user2 interface typ: sip
    And leave participant:
      | Participant | meetingID | roomType |
      | user2       | context   | audio    |
      | user1       | context   | audio    |
    Then destroy audio room

  @TMU-20456
  Scenario: add user without SDP
    Given System is running on MCU_HOME
    Given create conference 100021
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with caseType INVITE_WITHOUT_SDP
    And leave participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
    Then destroy audio room

  @audio
  @10-users
  Scenario: 10 users in parallel
    Given System is running on MCU_HOME
    Given create conference 100022
    When create audio room for host chandler
    And bulk add 10 participant:
      | Participant | meetingID | roomType |
      | user        | context   | audio    |
    And bulk leave 10 participant:
      | Participant | meetingID | roomType |
      | user        | context   | audio    |
    Then destroy audio room

  @nightly
  @audio
  @4-rooms-60-user
  Scenario Outline: X users in Y rooms in parallel
    When set: ADDRESS MCU_HOME, USERS <USERS>, ROOMS <ROOM> -, SPEAK_USERS 15, VIDEO_PUB_USERS 15, FAILURE_MECHANISM FALSE
    And open audio rooms with participants with delay of <DELAY-O> seconds between rooms
    And close audio rooms with participants with delay of <DELAY-C> seconds between rooms

    Examples:
      | USERS | ROOM | DELAY-O | DELAY-C | STOP_ON_FAILURE |
      | 15    | 4    | 0       | 10      | FALSE           |
      | 15    | 10   | 0       | 10      | FALSE           |
      | 100   | 1    | 0       | 10      | FALSE           |
      #| 15    | 18   | 0       | 10      | FALSE           |
      #| 200   | 1    | 0       | 10      | FALSE           |


  @audio
  @TMU-24165
  Scenario: add user with usedtx in SDP
    Given System is running on MCU_HOME
    Given create conference 100026
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with caseType INVITE_WITH_USEDTX
    And leave participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
    Then destroy audio room

  @nightly
  @audio
  @TMU-24520
  @isReady
  Scenario: open 5 rooms with 20 users, check media-gateway isReady
    When set: ADDRESS MCU_HOME, USERS 20, ROOMS 5 -, SPEAK_USERS 0, VIDEO_PUB_USERS 0, FAILURE_MECHANISM FALSE
    And open audio rooms with participants with delay of 10 seconds between rooms
    Then Sleep 90 sec in case STREAM set to TRUE
    And close audio rooms with participants with delay of 0 seconds between rooms
#
#  @audio
#  @data-channel
#  @TMU-26548
#  Scenario: reInvite data-channel user
#    Given System is running on MCU_HOME
#    Given create conference 100027
#    When create audio room for host chandler
#    When create data-channel room for host chandler
#    And add participant:
#      | Participant | meetingID | roomType     |
#      | chandler    | context   | audio        |
#      | chandler    | context   | data-channel |
#    And chandler reInvite in data-channel roomType as receiver
#    And leave participant:
#      | Participant | meetingID | roomType     |
#      | chandler    | context   | audio        |
#      | chandler    | context   | data-channel |
#    Then destroy audio room
#    Then destroy data-channel room

  @audio
  @MCU-2636
  @TMU-27269
  Scenario: add two users without SDP
    Given System is running on MCU_HOME
    Given create conference 100028
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with caseType INVITE_WITHOUT_SDP
    And add participant ross with meetingID context and roomType audio with caseType INVITE_WITHOUT_SDP
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @audio
  @TMU-30999
  @MCU-2839
  Scenario: add ssc user to meeting
    Given System is running on MCU_HOME
    Given create conference 100031
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType |
      | chandler    | context   | audio    |          |
      | ross        | context   | audio    | ssc_user |
    And leave participant:
      | Participant | meetingID | roomType     |
      | ross        | context   | audio        |
      | chandler    | context   | audio        |
    Then destroy audio room

    @TMU-31766
    @codecs
  Scenario Outline: codecs configuration
    Given System is running on MCU_HOME
    Given create conference <CONFERENCE_ID>
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType    | deviceType    | caseType    | infoType    |   codecListInput   | codecOutPut    |
      | chandler    | context   | audio    | <USER_TYPE> | <DEVICE_TYPE> | <CASE_TYPE> | <INFO_TYPE> | <CODEC_LIST_INPUT> | <CODEC_OUTPUT> |
    And leave participant:
      | Participant | meetingID | roomType     |
      | chandler    | context   | audio        |
    Then destroy audio room

    Examples:
     |CONFERENCE_ID | USER_TYPE |DEVICE_TYPE | CASE_TYPE |  INFO_TYPE   |         CODEC_LIST_INPUT           | CODEC_OUTPUT |
     |   100036     | receiver  |            |           |              |AMR-WB,AMR,PCMU,PCMA,G729,G722,OPUS | OPUS         |
     |   100037     | receiver  |            |           |              |OPUS,AMR-WB,AMR,PCMU,PCMA,G729,G722 | OPUS         |
     |   100038     | receiver  |            |           |              |PCMA,G729,G722,PCMU                 | PCMU         |
     |   100039     | pstn      |  PSTN      |           |              |AMR-WB,AMR,PCMU,PCMA,G729,G722,OPUS | AMR-WB       |
     |   100040     | pstn      |  PSTN      |           |              |OPUS,AMR-WB,AMR,PCMU,PCMA,G729,G722 | AMR-WB       |
     |   100041     | pstn      |  PSTN      |           |              |OPUS,AMR,PCMU,PCMA,G729,G722        | AMR          |
     |   100042     |           |            | DTMF_USER | PLAY_COLLECT |AMR,PCMU,PCMA,G729,AMR-WB,G722,OPUS | AMR-WB       |
     |   100043     |           |            | DTMF_USER | PLAY_COLLECT |OPUS,PCMU,PCMA,G729,G722            | PCMU         |
     |   100044     |           |            | DTMF_USER | PLAY_COLLECT |G722                                | G722         |
     |   100046     | receiver  |            |           |              |G722,G7221                          | G722         |

  @audio
  @codecs
  @error-test
  @TMU-31765
  Scenario: unsupported codec in SDP
    Given System is running on MCU_HOME
    Given create conference 100045
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with codecListInput G719
    Then chandler should get errorCode: 500, errorReason: Unsupported Audio response on INVITE audio roomType
    Then destroy audio room


    @TMU-32169
    @audio
    @deviceId
  Scenario: deviceID
    Given System is running on MCU_HOME
    Given create conference 100048
    When create audio room for host chandler
    And add participant:
      | Participant| meetingID | roomType | deviceId |
      | chandler   | context   | audio    |100047111 |
      | ross       | context   | audio    |100047222 |
    And leave participant:
      | Participant| meetingID | roomType | deviceId |
      | chandler   | context   | audio    |100047111 |
      | ross       | context   | audio    |100047222 |
    Then destroy audio room


    @TMU-32184
    @audio
    @deviceId
  Scenario: same user with diff deviceId
    Given System is running on MCU_HOME
    Given create conference 100049
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | deviceId |
      | chandler    | context   | audio    |100046111 |
      | chandler    | context   | audio    |100046222 |
    And verify To tag is diff between 100046111 devcieId and 100046222 deviceId for user chandler
    And leave participant:
      | Participant | meetingID | roomType | deviceId |
      | chandler    | context   | audio    |100046111 |
      | chandler    | context   | audio    |100046222 |
    Then destroy audio room


  @TMU-32170
  @audio
  @deviceId
  Scenario: reInvite with deviceId
    Given System is running on MCU_HOME
    Given create conference 100050
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | deviceId |
      | chandler    | context   | audio    | 100050111|
    And chandler reInvite in audio-video roomType as sendrecv and deviceId 100050111
    And leave participant:
      | Participant | meetingID | roomType | deviceId  |
      | chandler    | context   | audio    | 100050111 |
    Then destroy audio room


